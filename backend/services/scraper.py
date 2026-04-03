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
    "phone": r'\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b'
}

class DarkDumpScraper:
    def __init__(self, use_tor=False):
        self.use_tor = use_tor
        self.tor_port = self._detect_tor_port() if use_tor else None
        self.proxy_config = {
            'http': f'socks5h://127.0.0.1:{self.tor_port}',
            'https': f'socks5h://127.0.0.1:{self.tor_port}'
        } if self.tor_port else {}
        
        if self.use_tor and self.tor_port:
            self.ahmia_base = "http://juhanurmihxlp77nkq76byazcldy2hlmovfu2epvl5ankdibsot4csyd.onion"
        else:
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
        """Removes underlying code noise but strictly preserves all page readable text layout."""
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        return "\n".join([line.strip() for line in soup.get_text(separator="\n", strip=True).splitlines() if line.strip()])

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
        # 0. Load Threat Patterns (Categorized)
        try:
            config_path = os.path.join(os.path.dirname(__file__), '..', 'threat_config.json')
            with open(config_path, 'r') as f:
                threat_config = json.load(f)
        except Exception as e:
            print(f"[Threat:Error] Config load failed: {e}")
            threat_config = {"leak_patterns": {}, "threat_keywords": []}

        # 1. Basic Metadata
        metadata = {
            "title": soup.title.string.strip() if soup.title and soup.title.string else "Untitled",
            "description": "",
            "keywords": [],
            "author": "",
            "fonts": []
        }
        
        for meta in soup.find_all('meta'):
            name = meta.get('name', '').lower()
            cont = meta.get('content', '')
            if not cont: continue
            
            if name in ['description', 'abstract']: metadata['description'] = cont
            elif name in ['keywords', 'tags']: metadata['keywords'] = [k.strip() for k in cont.split(',')]
            elif name in ['author', 'creator']: metadata['author'] = cont

        if not metadata['description']:
            for p in soup.find_all('p'):
                text = p.get_text(separator=' ', strip=True)
                if len(text) > 30:
                    metadata['description'] = (text[:200] + "...") if len(text) > 200 else text
                    break

        if metadata['title'] == "Untitled":
            h1 = soup.find('h1')
            if h1: metadata['title'] = h1.get_text(strip=True)[:100]

        fonts_found = set()
        for link in soup.find_all('link', href=True):
            href = link.get('href', '')
            if 'font' in href.lower() or 'googleapis.com/css' in href.lower():
                fonts_found.add(href)
        
        for style in soup.find_all('style'):
            if style.string:
                for match in re.findall(r'font-family:\s*([^;\}]+)', style.string, re.I):
                    fonts_found.add(match.strip().strip("'\""))

        for tag in soup.find_all(style=re.compile(r'font-family:', re.I)):
            for match in re.findall(r'font-family:\s*([^;]+)', tag.get('style', ''), re.I):
                fonts_found.add(match.strip().strip("'\""))

        metadata['fonts'] = list(fonts_found)[:20]

        # 2. Text Intelligence & Deep Leak Detection
        text_content = self.clean_html(soup)
        title = metadata["title"]
        
        # We categorize leaks based on the threat_config
        leaked_data = {}
        
        # Legacy/Standard patterns first
        for leak_type, pattern in LEAK_PATTERNS.items():
            matches = list(set(re.findall(pattern, text_content, re.IGNORECASE)))
            if matches:
                leaked_data[leak_type] = matches

        # Specialized categorized patterns from JSON
        patterns = threat_config.get("leak_patterns", {})
        for category, cat_patterns in patterns.items():
            if category not in leaked_data:
                leaked_data[category] = []
            
            for p_name, p_raw in cat_patterns.items():
                try:
                    # The patterns in JSON are strings like "r'...'". We need to eval or strip.
                    # Strip "r'" and "'"
                    p_clean = p_raw.strip().lstrip("r'").rstrip("'")
                    matches = list(set(re.findall(p_clean, text_content, re.IGNORECASE)))
                    if matches:
                        # Normalize matches (flattening tuples if needed)
                        flat_matches = []
                        for m in matches:
                            if isinstance(m, tuple): flat_matches.append(":".join(m))
                            else: flat_matches.append(str(m))
                        leaked_data[category].extend(flat_matches)
                except Exception as e:
                    print(f"[Threat:PatternErr] {category}/{p_name}: {e}")

        # Final cleanup of leaked_data (unique values)
        leaked_data = {k: list(set(v)) for k, v in leaked_data.items() if v}

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

        # Inject discovered onion links into leaked data directly
        if internal_links:
            leaked_data['onion_links'] = internal_links[:50]

        return {
            "title": title,
            "text": text_content,
            "leaks": leaked_data,
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
                full_text=intel["text"],
                score=score,
                matched_keywords=matched_kws,
                leaked_data=intel["leaks"],
                metadata={
                    **intel["metadata"], 
                    **ai_tags,
                    "leaks": intel["leaks"]
                },
                emails=intel["leaks"].get("emails", intel["leaks"].get("email", [])),
                images=intel["images"]
            )
        except Exception as e:
            print(f"[Scraper] Critical failure on {url}: {e}")
            return None
