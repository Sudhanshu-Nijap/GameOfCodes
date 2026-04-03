import requests
import random
import re
import os
import json
import time
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Any
from models import ScrapedResult
from services.scoring import calculate_relevance_score

# ── Optimized Configuration ───────────────────────────────────────────────────

# Flagship Tor-optimized User-Agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
    "Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0"
]

# Advanced PII & Leak Detection Patterns
LEAK_PATTERNS = {
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "bitcoin": r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b',
    "ethereum": r'\b0x[a-fA-F0-9]{40}\b',
    "api_key": r'(?:api|secret|token|key)[_-]?(\b[a-zA-Z0-9]{32,64}\b)',
    "private_key": r'-----BEGIN (?:RSA|OPENSSH) PRIVATE KEY-----',
    "phone": r'\b\+?[1-9]\d{1,14}\b'
}

class DarkDumpScraper:
    def __init__(self, use_tor=False):
        self.use_tor = use_tor
        self.tor_port = self._detect_tor_port() if use_tor else None
        self.proxy_config = {
            'http': f'socks5h://127.0.0.1:{self.tor_port}',
            'https': f'socks5h://127.0.0.1:{self.tor_port}'
        } if self.tor_port else {}
        self.ahmia_base = "https://ahmia.fi"
        self.ahmia_search = f"{self.ahmia_base}/search/?q="

    def _detect_tor_port(self) -> Optional[int]:
        """Automatically detects if Tor is running on 9150 (Browser) or 9050 (Service)."""
        import socket
        for port in [9150, 9050]:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                if s.connect_ex(('127.0.0.1', port)) == 0:
                    print(f"[Tor] Active circuit detected on port {port}")
                    return port
        print("[Tor:Warn] No active Tor circuit found on 9150 or 9050.")
        return 9150 # Default fallback

    def _get_headers(self):
        return {'User-Agent': random.choice(USER_AGENTS)}

    def clean_html(self, soup: BeautifulSoup) -> str:
        """Removes noise (scripts, styles, nav) to focus on content for intelligence scoring."""
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()
        return " ".join(soup.get_text(separator=" ", strip=True).split())

    async def _search_ahmia_async(self, query: str, amount: int) -> List[Dict]:
        """Internal async method for Playwright-based search discovery with stealth."""
        from playwright.async_api import async_playwright
        
        async with async_playwright() as pw:
            # Enhanced stealth: mask 'webdriver' and set a standard viewport
            browser = await pw.chromium.launch(headless=True, args=[
                "--no-sandbox", 
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ])
            
            # Use the detected Tor port or fallback to default
            port = self.tor_port or 9150
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={'width': 1280, 'height': 800},
                proxy={"server": f"socks5://127.0.0.1:{port}"} if self.use_tor else None
            )
            
            # Mask the webdriver flag in the background
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            page = await context.new_page()
            
            try:
                # 1. Start at the Homepage to trigger Ahmia's session/token hydration
                print(f"[Search:Stealth] Triggering session on {self.ahmia_base}...")
                await page.goto(self.ahmia_base, wait_until="domcontentloaded", timeout=45000)
                
                # 2. Wait for the search input to be interactable
                await page.wait_for_selector('input[name="q"]', state="visible", timeout=15000)
                
                # 2. Perform search via the actual UI elements to trigger JS events
                print(f"[Search:Stealth] Inputting query: {query}")
                await page.fill('input[name="q"]', query)
                await page.keyboard.press("Enter")
                
                # 3. Wait for the list of search results to hydrate
                print(f"[Search:Stealth] Waiting for results to hydrate...")
                await page.wait_for_selector('li.result', timeout=30000)
                
                # 4. Extract candidates (Titles, URLs, Snippets)
                results = await page.evaluate("""
                    () => Array.from(document.querySelectorAll('li.result')).map(el => {
                        const link = el.querySelector('a[href*=".onion"]');
                        const cite = el.querySelector('cite');
                        const rawUrl = cite ? cite.innerText : (link ? link.href : '');
                        return {
                            title: el.querySelector('h4') ? el.querySelector('h4').innerText : 'No Title',
                            url: rawUrl.replace('http://', '').replace('https://', '').split('/')[0],
                            description: el.querySelector('p') ? el.querySelector('p').innerText : 'No description'
                        };
                    })
                """)
                
                # Clean and filter results
                final_results = []
                for r in results:
                    if not r['url']: continue
                    url = f"http://{r['url']}" if not r['url'].startswith('http') else r['url']
                    if ".onion" in url:
                        final_results.append({
                            "title": r['title'],
                            "url": url,
                            "description": r['description']
                        })
                        
                print(f"[Search:Success] Successfully indexed {len(final_results)} .onion targets.")
                return final_results[:amount]
            except Exception as e:
                print(f"[Search:Critical] Discovery engine encounter an error: {e}")
                return []
            finally:
                await browser.close()

    def search_ahmia(self, query: str, amount: int = 20) -> List[Dict]:
        """
        Fetch search results from Ahmia.fi index using Playwright discovery.
        This handles Ahmia's dynamic anti-scraping tokens automatically.
        
        Safe for use inside async environments (FastAPI) or sync CLI.
        """
        import asyncio
        from concurrent.futures import ThreadPoolExecutor
        print(f"[Search] Discovery phase for: {query}...")
        
        try:
            # We use a thread to run the async discovery logic to avoid 
            # 'Loop already running' conflicts in FastAPI.
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(asyncio.run, self._search_ahmia_async(query, amount))
                results = future.result()
        except Exception as e:
            print(f"[Search:Critical] Async bridge failure: {e}")
            results = []
            
        print(f"[Search] Discovery complete. Found {len(results)} targets.")
        return results

    def extract_intel(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Unified extraction logic for intelligence gathering."""
        # 1. Basic Metadata
        metadata = {
            "title": soup.title.string if soup.title else "Untitled",
            "description": "",
            "keywords": [],
            "author": "",
            "og_title": "",
            "og_description": ""
        }
        
        for meta in soup.find_all('meta'):
            name = meta.get('name', '').lower()
            prop = meta.get('property', '').lower()
            cont = meta.get('content', '')
            if name == 'description': metadata['description'] = cont
            elif name == 'keywords': metadata['keywords'] = [k.strip() for k in cont.split(',')]
            elif name == 'author': metadata['author'] = cont
            elif prop == 'og:title': metadata['og_title'] = cont
            elif prop == 'og:description': metadata['og_description'] = cont

        # 2. Text Intelligence & Leak Detection
        text_content = self.clean_html(soup)
        title = metadata["title"]
        detected_leaks = {}
        for leak_type, pattern in LEAK_PATTERNS.items():
            matches = list(set(re.findall(pattern, text_content, re.IGNORECASE)))
            if matches:
                detected_leaks[leak_type] = matches

        # 3. Image Evidence extraction
        images = []
        for img in soup.find_all('img'):
            src = img.get('src')
            if src and not src.startswith('data:image'):
                abs_src = src if src.startswith('http') else f"{url.rstrip('/')}/{src.lstrip('/')}"
                images.append(abs_src)

        # 4. Link Discovery (.onion only)
        internal_links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            if ".onion" in href:
                abs_href = href if href.startswith('http') else f"{url.rstrip('/')}/{href.lstrip('/')}"
                if abs_href not in internal_links:
                    internal_links.append(abs_href)

        return {
            "title": title,
            "text": text_content,
            "leaks": detected_leaks,
            "metadata": metadata,
            "images": list(dict.fromkeys(images))[:10],
            "internal_links": internal_links[:50]
        }

    async def playwright_scrape(self, url: str) -> Optional[str]:
        """Internal async method for JS-rendered scraping via Tor."""
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as pw:
                # Use standard socks5 prefix for Playwright
                port = self.tor_port or 9150
                browser = await pw.chromium.launch(
                    headless=True,
                    proxy={"server": f"socks5://127.0.0.1:{port}"} if self.use_tor else None,
                    args=["--no-sandbox", "--disable-dev-shm-usage"]
                )
                page = await browser.new_page()
                # Use high timeout for Tor
                await page.goto(url, wait_until="domcontentloaded", timeout=90000)
                html = await page.content()
                await browser.close()
                return html
        except Exception as e:
            print(f"[Scraper] Playwright failed: {e}")
            return None

    def scrape_onion(self, url: str, primary_keyword: str = "", secondary_keywords: List[str] = [], 
                     include_images: bool = False, use_js: Optional[bool] = None) -> Optional[ScrapedResult]:
        """Deep scrape an individual onion site with optional JS rendering."""
        try:
            start_time = time.time()
            html = None
            
            # Use Playwright if explicitly requested OR if it's an .onion site (default)
            if use_js is True or (use_js is None and ".onion" in url):
                import asyncio
                from concurrent.futures import ThreadPoolExecutor
                print(f"[Scraper] Launching Playwright for intelligence extraction on {url}...")
                
                try:
                    with ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(asyncio.run, self.playwright_scrape(url))
                        html = future.result()
                except Exception as e:
                    print(f"[Scraper:Error] Async bridge failure for {url}: {e}")
                    html = None
            
            if not html:
                headers = self._get_headers()
                response = requests.get(url, headers=headers, proxies=self.proxy_config, timeout=30)
                if response.status_code == 200:
                    html = response.text

            if not html:
                return None
                
            soup = BeautifulSoup(html, 'html.parser')
            intel = self.extract_intel(soup, url)
            
            # AI Intelligence Tagging
            ai_tags = {}
            try:
                from services.groq_nlp_engine import groq_nlp_engine
                nlp = groq_nlp_engine.parse_query(intel["text"][:1500])
                ai_tags = {
                    "topic": nlp.get("primary", "unknown"),
                    "confidence": nlp.get("confidence_score", 0.0)
                }
            except: pass

            score, matched_kws = calculate_relevance_score(intel["text"], intel["title"], primary_keyword, secondary_keywords)
            
            snippet = ""
            if matched_kws:
                match = re.search(f".{{0,100}}{re.escape(matched_kws[0])}.{{0,100}}", intel["text"], re.IGNORECASE)
                snippet = f"...{match.group(0)}..." if match else intel["text"][:200]
            
            return ScrapedResult(
                title=intel["title"],
                url=url,
                description=intel["metadata"].get('description', "Shadow intelligence index"),
                snippet=snippet or intel["text"][:200],
                score=score,
                matched_keywords=matched_kws,
                metadata={
                    **intel["metadata"], 
                    **ai_tags,
                    "leaks": list(intel["leaks"].keys()),
                    "discovery_count": len(intel["internal_links"]),
                    "method": "playwright" if use_js else "requests"
                },
                emails=intel["leaks"].get("email", []),
                images=intel["images"]
            )
        except Exception as e:
            print(f"[Scraper] Critical failure on {url}: {e}")
            return None
