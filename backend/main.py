import os
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
)
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

# ── In-memory search task store ───────────────────────────────────────────────

tasks_db: Dict[str, SearchTask] = {}
# Standardized to use Tor by default for .onion searches
scraper = DarkDumpScraper(use_tor=True)


# ── Search endpoints ──────────────────────────────────────────────────────────

async def run_search_task(task_id: str, request: SearchRequest):
    task = tasks_db[task_id]
    task.status = "running"

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
            task.results = []
            task.status = "completed"
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
        task.results = final_results
        task.status = "completed"

    except Exception as e:
        task.status = "failed"
        task.error = str(e)
        traceback.print_exc()


from fastapi import BackgroundTasks

@app.post("/api/search", response_model=SearchTask)
def start_search(request: SearchRequest, bg: BackgroundTasks):
    task_id = str(uuid.uuid4())
    task = SearchTask(id=task_id, status="pending")
    tasks_db[task_id] = task
    bg.add_task(run_search_task, task_id, request)
    return task


@app.post("/api/intel/quick-scrape", response_model=ScrapedResult)
def quick_scrape(request: IntelRequest):
    """
    POST /api/intel/quick-scrape
    Performs a deep, synchronous (with UI wait) scrape of a single .onion URL.
    """
    print(f"[Intel:Quick] Deep scraping target: {request.url}")
    result = scraper.scrape_onion(
        url=request.url,
        primary_keyword=request.primary_keyword,
        secondary_keywords=request.secondary_keywords,
        include_images=request.include_images
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Target unreachable or intelligence extraction failed.")
        
    return result


@app.get("/api/tasks/{task_id}", response_model=SearchTask)
def get_task(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks_db[task_id]


@app.get("/api/history", response_model=List[SearchTask])
def get_history():
    return [t for t in tasks_db.values() if t.status == "completed"]


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


# ── Dev server ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
