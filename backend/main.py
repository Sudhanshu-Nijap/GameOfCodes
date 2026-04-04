import os
from dotenv import load_dotenv
load_dotenv()

os.environ["USE_TORCH"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import asyncio
import traceback
import uuid
from typing import Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from database import get_db, get_collection, init_indexes
from bson import ObjectId
import datetime
from models import (
    DiscoveryResultView,
    DiscoveryStats,
    ScrapedResult,
    ScrapeRequest,
    IntelRequest,
    SearchRequest,
    SearchTask,
    UserCreate,
    UserLogin,
    UserResponse,
    Token
)
from pydantic import BaseModel

class NLPInputBody(BaseModel):
    text: str

from services.scraper import DarkDumpScraper

try:
    from services.groq_nlp_engine import groq_nlp_engine
except Exception as e:
    print(f"[WARN] Could not import groq_nlp_engine: {e}")
    groq_nlp_engine = None

try:
    from tasks import scrape_onion_task
except Exception as e:
    print(f"[WARN] Could not import tasks: {e}")
    scrape_onion_task = None

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="DarkWebIntel API", version="2.0.0")

@app.on_event("startup")
async def startup_event():
    import threading
    # Run index initialization in a background thread to prevent blocking the API
    threading.Thread(target=init_indexes, daemon=True).start()


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    print("── VALIDATION ERROR ──")
    print(exc.errors())
    print("─────────────────────")
    return Response(content=str(exc.errors()), status_code=422)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("── GLOBAL ERROR ──")
    traceback.print_exc()
    print("──────────────────")
    return Response(content=f"Internal Server Error: {str(exc)}", status_code=500)


# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database import get_db, get_collection, get_tasks_collection, get_intel_collection, get_users_collection, init_indexes
from services.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

# ── Persistent Stores (Removed in-memory tasks_db) ───────────────────────────
# Standardized to use Tor by default for .onion searches
scraper = DarkDumpScraper(use_tor=True)


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate):
    users_coll = get_users_collection()
    if users_coll is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    if users_coll.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user_dict["password"])
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.datetime.utcnow()
    
    users_coll.insert_one(user_dict)
    
    return UserResponse(
        id=user_dict["id"],
        first_name=user_dict["first_name"],
        last_name=user_dict["last_name"],
        organization_name=user_dict["organization_name"],
        email=user_dict["email"]
    )

@app.post("/api/auth/login", response_model=Token)
def login(user_credentials: UserLogin):
    users_coll = get_users_collection()
    if users_coll is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    user = users_coll.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ── Search endpoints ──────────────────────────────────────────────────────────

async def run_search_task(task_id: str, request: SearchRequest):
    tasks_coll = get_tasks_collection()
    if tasks_coll is None:
        print("[Error] Could not access tasks collection.")
        return

    # Update status to running
    tasks_coll.update_one({"id": task_id}, {"$set": {"status": "running"}})

    query_params = {
        "primary": request.primary_keyword, 
        "secondary": request.secondary_keywords,
        "ahmia_keywords": request.secondary_keywords[:3]
    }

    if getattr(request, "use_groq_nlp", False) and groq_nlp_engine:
        try:
            parsed = groq_nlp_engine.parse_query(request.primary_keyword)
            query_params = {
                "primary": parsed["primary"], 
                "secondary": parsed["secondary"],
                "ahmia_keywords": parsed.get("ahmia_query_keywords", []),
                "search_string": parsed.get("search_query")
            }
        except Exception as e:
            print(f"[GroqNLP] Falling back: {e}")

    try:
        query = query_params.get("search_string") 
        if not query:
            query = f"{query_params['primary']} {' '.join(query_params['ahmia_keywords'])}".strip()
            
        print(f"[Search:Batch] Discovery phase for: {query}")
        raw_results = scraper.search_ahmia(query, amount=request.amount)

        if not raw_results:
            tasks_coll.update_one({"id": task_id}, {"$set": {"status": "completed", "results": []}})
            return

        from services.scoring import calculate_relevance_score
        coll = get_collection()
        final_results = []

        async def process_result(res):
            try:
                # 1. Start with the basic search result from Ahmia
                existing = coll.find_one({"url": res["url"]})
                
                enrichment = {
                    "images": [],
                    "metadata": {"source": "Ahmia Search Index"},
                    "emails": [],
                    "documents": [],
                    "snippet": res["description"]
                }
                
                if existing:
                    print(f"[Enrichment] Merging deep intel for {res['url']}")
                    intel = existing.get("metadata_json", {})
                    enrichment.update({
                        "images": (existing.get("images", []) or []) + (existing.get("base64_images", []) or []),
                        "metadata": intel.get("metadata", {}),
                        "emails": intel.get("emails", []) or existing.get("emails", []),
                        "documents": intel.get("documents", []) or existing.get("documents", []),
                        "snippet": (existing.get("text_content", "")[:300] + "...") if existing.get("text_content") else res["description"]
                    })

                score, matched = calculate_relevance_score(
                    res["description"], res["title"],
                    query_params['primary'], query_params['secondary']
                )
                
                return ScrapedResult(
                    title=res["title"],
                    url=res["url"],
                    description=res["description"],
                    snippet=enrichment["snippet"],
                    score=score,
                    matched_keywords=matched,
                    metadata={**enrichment["metadata"], "enriched": bool(existing)},
                    images=enrichment["images"],
                    emails=enrichment["emails"],
                    documents=enrichment["documents"]
                )
            except Exception as e:
                print(f"[Process] Result failure for {res.get('url')}: {e}")
                return None

        # Chunk results into groups of 10 for parallel execution
        chunk_size = 10
        for i in range(0, len(raw_results), chunk_size):
            chunk = raw_results[i:i + chunk_size]
            print(f"[Search:Batch] Processing chunk {i//chunk_size + 1} ({len(chunk)} items)...")
            batch_results = await asyncio.gather(*[process_result(r) for r in chunk])
            final_results.extend([r for r in batch_results if r])

        # ── Sort by Score (Descending) ────────────────────────────────────────
        final_results.sort(key=lambda x: x.score, reverse=True)
        
        # Serialize results for MongoDB
        serialized_results = [r.model_dump() for r in final_results]
        tasks_coll.update_one({"id": task_id}, {"$set": {"status": "completed", "results": serialized_results}})

    except Exception as e:
        tasks_coll.update_one({"id": task_id}, {"$set": {"status": "failed", "error": str(e)}})
        traceback.print_exc()


from fastapi import BackgroundTasks

@app.post("/api/search", response_model=SearchTask)
def start_search(request: SearchRequest, bg: BackgroundTasks):
    task_id = str(uuid.uuid4())
    task = SearchTask(id=task_id, status="pending")
    
    tasks_coll = get_tasks_collection()
    if tasks_coll is not None:
        task_doc = task.model_dump()
        task_doc["timestamp"] = datetime.datetime.utcnow()
        tasks_coll.insert_one(task_doc)
        
    bg.add_task(run_search_task, task_id, request)
    return task


@app.post("/api/intel/quick-scrape", response_model=ScrapedResult)
def quick_scrape(request: IntelRequest):
    """
    POST /api/intel/quick-scrape
    Performs a deep, synchronous (with UI wait) scrape of a single .onion URL.
    """
    # ── 1. Check Cache ──────────────────────────────────────────────────────────
    intel_coll = get_intel_collection()
    if intel_coll is not None:
        cached = intel_coll.find_one({"url": request.url})
        if cached:
            # Check if it has a summary or detailed analysis (indicating it was successfully analyzed)
            has_analysis = cached.get("detailed_analysis") and cached["detailed_analysis"].get("summary")
            if has_analysis:
                print(f"[Intel:Cache] Returning stored intelligence for {request.url}")
                # Remove _id for Pydantic validation if present
                if "_id" in cached: cached.pop("_id")
                # Remove sensitive full_text from cache if we want to follow the same obfuscation
                cached["full_text"] = "CACHED INTELLIGENCE: Securely retrieved from local neural repository."
                return ScrapedResult.model_validate(cached)

    # ── 2. Perform Scrape ───────────────────────────────────────────────────────
    print(f"[Intel:Quick] Deep scraping target: {request.url}")
    result = scraper.scrape_onion(
        url=request.url,
        primary_keyword=request.primary_keyword,
        secondary_keywords=request.secondary_keywords,
        include_images=request.include_images
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Target unreachable or intelligence extraction failed.")
        
    # ── 3. Analyze content ─────────────────────────────────────────────────────
    from services.intel_analyzer import analyze_scraped_content
    
    if result.full_text:
        text_len = len(result.full_text)
        print(f"[Intel:Quick] Analysis triggered for {result.url} (Text length: {text_len} chars)")
        analysis_dict = analyze_scraped_content(result.full_text)
        from models import DetailedAnalysis
        # Parse the raw dict into the properly typed model so it serializes cleanly
        result.detailed_analysis = DetailedAnalysis(**analysis_dict)
    else:
        print(f"[Intel:Quick] NO CONTENT to analyze for {result.url}")
        from models import DetailedAnalysis
        result.detailed_analysis = DetailedAnalysis(summary="No extractable text content was found on this node to perform intelligence analysis.")

    # ── 4. Persistence ─────────────────────────────────────────────────────────
    if intel_coll is not None:
        report_doc = result.model_dump()
        report_doc["timestamp"] = datetime.datetime.utcnow()
        intel_coll.update_one({"url": result.url}, {"$set": report_doc}, upsert=True)

    # ── 5. Redaction for Frontend ──────────────────────────────────────────────
    result.full_text = "CLASSIFIED: Raw scraped intelligence has been securely deposited into the database for neural analysis. Direct text preview disabled per security policy."
    result.snippet = ""
    result.description = "Classified node content."

    return result


@app.get("/api/tasks/{task_id}", response_model=SearchTask)
def get_task(task_id: str):
    tasks_coll = get_tasks_collection()
    if tasks_coll is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    task_doc = tasks_coll.find_one({"id": task_id})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Clean up _id for Pydantic
    task_doc["id"] = str(task_doc.get("id"))
    if "_id" in task_doc: task_doc.pop("_id")
    
    return SearchTask.model_validate(task_doc)


@app.get("/api/history", response_model=List[SearchTask])
def get_history():
    tasks_coll = get_tasks_collection()
    if tasks_coll is None:
        return []
        
    cursor = tasks_coll.find({"status": "completed"}).sort("timestamp", -1).limit(50)
    results = []
    for doc in cursor:
        if "_id" in doc: doc.pop("_id")
        results.append(SearchTask.model_validate(doc))
    return results


# ── Proxy image ───────────────────────────────────────────────────────────────

@app.get("/api/proxy-image")
async def proxy_image(url: str):
    try:
        import requests  # type: ignore
        proxies = {"http": "socks5h://127.0.0.1:9150", "https": "socks5h://127.0.0.1:9150"} if ".onion" in url else {}
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, proxies=proxies, timeout=10, stream=True)
        if r.status_code == 200:
            return Response(content=r.content, media_type=r.headers.get("Content-Type", "image/png"))
        raise HTTPException(status_code=r.status_code, detail="Upstream error")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── Discovery / Scraper endpoints ─────────────────────────────────────────────

@app.post("/api/discovery/scrape")
def trigger_scrape(body: ScrapeRequest):
    """
    POST /api/discovery/scrape
    Body: { "urls": ["http://...onion"], "depth": 1, "use_js": true }
    """
    if not scrape_onion_task:
        raise HTTPException(status_code=503, detail="Celery worker unavailable")

    task_ids = []
    for url in body.urls:
        url = url.strip()
        if not url.startswith("http"):
            continue
        result = scrape_onion_task.delay(
            url=url,
            current_depth=0,
            max_depth=body.depth,
            parent_url="",
            use_js=body.use_js,
        )
        task_ids.append(result.id)

    return {"status": "queued", "count": len(task_ids), "task_ids": task_ids}


@app.get("/api/discovery/results", response_model=List[DiscoveryResultView])
def get_results(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db=Depends(get_db),
):
    """
    GET /api/discovery/results?status=completed&limit=50&offset=0
    """
    if db is None:
        # Return empty list or 503 instead of crashing
        return []
        
    coll = db["discovery_results"]
    query_filter = {}
    if status:
        query_filter["status"] = status
    
    cursor = coll.find(query_filter).sort("timestamp", -1).skip(offset).limit(limit)
    
    results = []
    for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        results.append(doc)
    return results


@app.get("/api/discovery/stats", response_model=DiscoveryStats)
def get_stats(db=Depends(get_db)):
    """
    GET /api/discovery/stats — Returns aggregate metrics for the stats bar.
    """
    if db is None:
        # Return empty stats if DB is down
        return DiscoveryStats(
            total_sites=0, completed=0, failed=0, pending=0,
            success_rate=0.0, total_images=0, total_links=0, avg_text_length=0
        )
        
    coll = db["discovery_results"]
    
    total     = coll.count_documents({})
    completed = coll.count_documents({"status": "completed"})
    failed    = coll.count_documents({"status": "failed"})
    pending   = total - completed - failed

    records = list(coll.find({"status": "completed"}))
    
    total_images = 0
    total_links  = 0
    total_text   = 0
    
    for r in records:
        total_images += len(r.get("images", []))
        total_links  += len(r.get("links", []))
        total_text   += len(r.get("text_content", ""))

    avg_text = int(total_text / max(len(records), 1))

    return DiscoveryStats(
        total_sites=int(total),
        completed=int(completed),
        failed=int(failed),
        pending=int(pending),
        success_rate=float(round(completed / max(total, 1) * 100, 1)),
        total_images=int(total_images),
        total_links=int(total_links),
        avg_text_length=int(avg_text),
    )


@app.delete("/api/discovery/{record_id}")
def delete_record(record_id: str, db=Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    coll = db["discovery_results"]
    try:
        res = coll.delete_one({"_id": ObjectId(record_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"status": "deleted", "id": record_id}
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid ID format")


@app.get("/api/discovery/export")
def export_results(db=Depends(get_db)):
    """
    Downloads all completed discovery results as a JSON file.
    """
    import json
    from fastapi.responses import JSONResponse
    
    coll = db["discovery_results"]
    records = list(coll.find({"status": "completed"}))
    
    # Serialize using the View model
    data = []
    for r in records:
        r["id"] = str(r.pop("_id"))
        data.append(DiscoveryResultView.model_validate(r).model_dump())
    
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": "attachment; filename=discovery_export.json"}
    )


# ── NLP ───────────────────────────────────────────────────────────────────────

@app.post("/api/nlp/parse")
def parse_query(query: str, use_groq: bool = True):
    """Parses a natural language query into primary/secondary keywords using Groq AI."""
    try:
        if groq_nlp_engine:
            return groq_nlp_engine.parse_query(query)
        raise HTTPException(status_code=503, detail="Groq NLP engine unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/nlp/intelligent-search")
def intelligent_search(body: NLPInputBody, bg: BackgroundTasks):
    from services.nlp_intelligent import process_nlp_input
    
    nlp_result = process_nlp_input(body.text)
    if "error" in nlp_result:
        raise HTTPException(status_code=500, detail=nlp_result["error"])
        
    target_words = nlp_result.get("target_words", body.text)
    organization = nlp_result.get("organization", "")
    
    secondary = []
    if organization:
        secondary.append(organization)
    
    secondary.extend(nlp_result.get("related_terms", []))
    
    request = SearchRequest(
        primary_keyword=target_words,
        secondary_keywords=secondary,
        use_nlp=False
    )
    
    task_id = str(uuid.uuid4())
    task = SearchTask(id=task_id, status="pending")
    
    tasks_coll = get_tasks_collection()
    if tasks_coll is not None:
        task_doc = task.model_dump()
        task_doc["timestamp"] = datetime.datetime.utcnow()
        tasks_coll.insert_one(task_doc)
        
    bg.add_task(run_search_task, task_id, request)
    
    return {
        "nlp_analysis": nlp_result,
        "task_id": task_id,
        "status": "Search started"
    }


# ── Dev server ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
