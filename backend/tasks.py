"""
tasks.py — Playwright-first .onion scraper with retry, dedup, and recursive crawling.

Workflow per URL:
  1. Check dedup hash (skip if already in DB)
  2. Try Playwright via Tor (up to 3 retries)
  3. Fall back to requests via Tor if Playwright fails
  4. Parse, clean, extract text/images/links/meta
  5. Persist to SQLite
  6. If depth > current_depth: enqueue discovered internal .onion links
"""

import asyncio
import datetime
import hashlib
import re
import time
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from celery import shared_task
from celery_app import celery_app
from database import get_collection
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

from services.scraper import DarkDumpScraper

# ── Config ───────────────────────────────────────────────────────────────────

MAX_RETRIES     = 3
RETRY_BACKOFF   = [5, 15, 30]   # seconds between retries

# ── Helpers ──────────────────────────────────────────────────────────────────

def url_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()

# ── Main Celery Task ──────────────────────────────────────────────────────────

@celery_app.task(name="scrape_onion_task", bind=True, max_retries=0)
def scrape_onion_task(self, url: str, current_depth: int = 0, max_depth: int = 1,
                      parent_url: str = "", use_js: bool = True):
    """
    Core scraping task.
    - current_depth: the depth level this URL is at (0 = seed)
    - max_depth: max allowed depth (1 = seed only, 2 = one level of recursion)
    - parent_url: which URL discovered this one
    - use_js: whether to use Playwright (True) or requests-only (False)
    """
    coll = get_collection()
    url_h = url_hash(url)
    scraper = DarkDumpScraper(use_tor=True)

    try:
        # ── Deduplication check ───────────────────────────────────────────
        existing = coll.find_one({"crawl_hash": url_h})
        if existing:
            print(f"[Dedup] Skipping already-indexed URL: {url}")
            return f"SKIPPED (duplicate): {url}"

        # ── Create DB record (pending → running) ──────────────────────────
        record = {
            "url": url,
            "crawl_hash": url_h,
            "status": "running",
            "title": "Fetching...",
            "text_content": "",
            "images": [],
            "base64_images": [],
            "links": [],
            "internal_links": [],
            "metadata_json": {},
            "failed_reason": "",
            "crawl_depth": current_depth,
            "parent_url": parent_url,
            "timestamp": datetime.datetime.utcnow(),
        }
        coll.insert_one(record)

        # ── Optimized Fetch & Parse ───────────────────────────────────────
        result = scraper.scrape_onion(url, use_js=use_js)

        if not result:
            coll.update_one(
                {"crawl_hash": url_h},
                {"$set": {"status": "failed", "title": "Unreachable", "failed_reason": "Scraper returned None"}}
            )
            print(f"[Task] FAILED: {url}")
            return f"FAILED: {url}"

        # ── Persist results ───────────────────────────────────────────────
        update_data = {
            "title":          result.title,
            "text_content":   result.description,
            "images":         result.images,
            "links":          result.metadata.get("internal_links", []),
            "metadata_json":  result.metadata, # This now contains 'emails', 'documents', 'pii_detected', etc.
            "status":         "completed",
            "timestamp":      datetime.datetime.utcnow(),
        }
        coll.update_one({"crawl_hash": url_h}, {"$set": update_data})

        print(
            f"[Task] DONE: {url} | "
            f"{len(result.images)} imgs | "
            f"{len(result.metadata.get('emails', []))} emails | "
            f"depth={current_depth}/{max_depth}"
        )

        # ── Recursive crawl ───────────────────────────────────────────────
        if current_depth < max_depth - 1:
            internal_links = result.metadata.get("internal_links", [])
            for child_url in internal_links:
                child_hash = url_hash(child_url)
                already = coll.find_one({"crawl_hash": child_hash})
                if not already:
                    print(f"[Crawl] Enqueueing depth-{current_depth + 1}: {child_url}")
                    scrape_onion_task.delay(
                        url=child_url,
                        current_depth=current_depth + 1,
                        max_depth=max_depth,
                        parent_url=url,
                        use_js=use_js,
                    )

        return f"SUCCESS: {url}"

    except Exception as e:
        import traceback
        traceback.print_exc()
        try:
            coll.update_one(
                {"crawl_hash": url_h},
                {"$set": {"status": "failed", "failed_reason": str(e)}}
            )
        except Exception:
            pass
        return f"ERROR: {url} — {e}"

    finally:
        pass
