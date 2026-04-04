import json
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime


# ── Search API ──────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    primary_keyword: str
    secondary_keywords: List[str] = []
    amount: int = 20
    include_images: bool = False
    use_nlp: bool = False
    use_advanced_nlp: bool = False
    use_groq_nlp: bool = False


class ThreatScoreInputs(BaseModel):
    has_credentials: bool = False
    has_financial_data: bool = False
    has_pii: bool = False
    has_internal_docs: bool = False
    has_source_code: bool = False
    is_actively_traded: bool = False

class DetailedAnalysis(BaseModel):
    data_types_found: List[str] = []
    threat_sentiment: str = "informational"
    sentiment_score: int = 0
    affected_org: str = ""
    exposure_level: str = "none"
    data_volume: str = "low"
    freshness: str = "unknown"
    risk_score: int = 0
    threat_score_inputs: ThreatScoreInputs = Field(default_factory=ThreatScoreInputs)
    summary: str = ""
    detailed_analysis: str = ""
    error: Optional[str] = None

class ScrapedResult(BaseModel):
    title: str
    url: str
    description: str
    snippet: Optional[str] = None
    full_text: Optional[str] = ""
    score: float = 0.0
    matched_keywords: List[str] = []
    metadata: Dict[str, Any] = {}
    leaked_data: Dict[str, List[str]] = {}
    emails: List[str] = []
    documents: List[str] = []
    images: List[str] = []
    detailed_analysis: Optional[DetailedAnalysis] = None


class SearchTask(BaseModel):
    id: str
    status: str          # "pending" | "running" | "completed" | "failed"
    results: List[ScrapedResult] = []
    error: Optional[str] = None


# ── Discovery / Scraper API ──────────────────────────────────────────────────

class IntelRequest(BaseModel):
    url: str
    primary_keyword: Optional[str] = ""
    secondary_keywords: List[str] = []
    include_images: bool = True


class ScrapeRequest(BaseModel):
    urls: List[str]
    depth: int = Field(default=1, ge=1, le=2)   # 1 = seed only, 2 = recursive
    use_js: bool = True                          # Playwright vs requests fallback


class DiscoveryResultView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    title: Optional[str]         = "Processing..."
    text_content: Optional[str]  = None
    images: Optional[List[str]]  = []
    base64_images: Optional[List[str]] = []
    links: Optional[List[str]]   = []
    internal_links: Optional[List[str]] = []
    metadata_json: Optional[Dict[str, Any]] = {}
    timestamp: Optional[datetime] = None
    status: Optional[str]        = "pending"
    failed_reason: Optional[str] = ""
    crawl_depth: Optional[int]   = 0
    parent_url: Optional[str]    = ""
    crawl_hash: Optional[str]    = ""



class DiscoveryStats(BaseModel):
    total_sites: int
    completed: int
    failed: int
    pending: int
    success_rate: float
    total_images: int
    total_links: int
    avg_text_length: int

# ── Auth API ─────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    organization_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    organization_name: str
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str
