
__version__ = 3

import sys
import os
import argparse
import requests
from bs4 import BeautifulSoup
import re
import json

# Ensure backend services are discoverable
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.scraper import DarkDumpScraper
from services.groq_nlp_engine import groq_nlp_engine
from banner.banner import Banner
from headers.agents import Headers

notice = '''
Note: 
    This tool is not to be used for illegal purposes.
'''

class Colors:
    W = '\033[0m'  # white 
    R = '\033[31m'  # red
    G = '\033[32m'  # green
    O = '\033[33m'  # orange
    B = '\033[34m'  # blue
    P = '\033[35m'  # purple
    C = '\033[36m'  # cyan
    GR = '\033[37m'  # gray
    BOLD = '\033[1m'
    END = '\033[0m'

class Configuration:
    DARKDUMP_ERROR_CODE_STANDARD = -1
    DARKDUMP_SUCCESS_CODE_STANDARD = 0
    DARKDUMP_RUNNING = False
    __darkdump_base__ = "https://ahmia.fi"

class Platform(object):
    def __init__(self, execpltf):
        self.execpltf = execpltf

    def get_operating_system_descriptor(self):
        clr = Colors()
        if self.execpltf:
            print(clr.BOLD + clr.W + "Operating System: " + clr.G + sys.platform + clr.END)

    def clean_screen(self):
        if self.execpltf:
            os.system('cls' if os.name == 'nt' else 'clear')

    def check_tor_connection(self, proxy_config):
        test_url = 'https://check.torproject.org/api/ip'
        try:
            response = requests.get(test_url, proxies=proxy_config, timeout=20)
            if response.status_code == 200:
                data = response.json()
                if data.get('IsTor', False):
                    print(f"{Colors.BOLD + Colors.G}Tor service is active.{Colors.END}")
                    print(f"{Colors.BOLD + Colors.P}Current IP via Tor: {Colors.END}{data.get('IP')}")
                    return True
            print(f"{Colors.BOLD + Colors.R}Connection successful but not through Tor.{Colors.END}")
            return False
        except Exception as e:
            print(f"{Colors.BOLD + Colors.R}Tor is inactive or not configured: {str(e)}{Colors.END}")
            return False

class Darkdump(object):
    def __init__(self, use_proxy=False):
        # Initialize our optimized service layer
        # Correctly configure paths for the service imports when running as a CLI
        import sys
        sys.path.append(os.path.join(os.getcwd(), 'backend'))
        self.scraper = DarkDumpScraper(use_tor=use_proxy)

    def scrape_direct(self, url, scrape_images=False, use_js=None):
        """Optimized direct URL scraping using the unified engine."""
        print(f"{Colors.BOLD}{Colors.B}[*] Investigating Intelligence Vector: {Colors.END}{Colors.P}{url}{Colors.END}")
        
        result = self.scraper.scrape_onion(
            url=url, 
            include_images=scrape_images,
            use_js=use_js # Defaults to True for .onion in the scraper
        )
        
        if result:
            self._print_result(1, result)
        else:
            print(f"{Colors.BOLD}{Colors.R}[!] Intelligence extraction failed for: {url}{Colors.END}")

    def _print_result(self, idx, result):
        """Unified result printer for the CLI."""
        print('-' * 60)
        print(f"{Colors.BOLD}{idx}. [✓] INTEL CAPTURED: {Colors.END}{Colors.P}{result.title}{Colors.END}")
        print(f"{Colors.BOLD}| URL: {Colors.END}{Colors.G}{result.url}{Colors.END}")
        print(f"{Colors.BOLD}| RELEVANCE: {Colors.END}{Colors.C}{result.score}{Colors.END}")
        
        if result.metadata.get('topic'):
             print(f"{Colors.BOLD}| AI CLASSIFICATION: {Colors.END}{Colors.O}{result.metadata['topic'].upper()}{Colors.END} (Conf: {result.metadata.get('confidence', 0):.2f})")
        
        print(f"{Colors.BOLD}| SNIPPET: {Colors.END}{Colors.W}{result.snippet.strip()}{Colors.END}")
        
        if result.emails:
            print(f"{Colors.BOLD}| EMAILS: {Colors.END}{Colors.R}{', '.join(result.emails)}{Colors.END}")
        
        if result.metadata.get('leaks'):
            print(f"{Colors.BOLD}| LEAK VECTORS: {Colors.END}{Colors.R}{', '.join(result.metadata['leaks'])}{Colors.END}")
            
        print(f"{Colors.BOLD}| DISCOVERY: {Colors.END}{Colors.GR}{result.metadata.get('discovery_count', 0)} internal links found.{Colors.END}")
        
        if result.images:
             print(f"{Colors.BOLD}| EVIDENCE: {Colors.END}{Colors.G}{len(result.images)} images collected.{Colors.END}")

    def crawl(self, query, amount, use_proxy=False, scrape_sites=False, scrape_images=False, use_js=None):
        """Optimized search & crawl using the unified engine."""
        print(f"{Colors.BOLD}[*] Initializing Intelligence Scan for: {Colors.END}{Colors.C}{query}{Colors.END}\n")
        
        # 1. Search Ahmia using optimized scraper
        search_results = self.scraper.search_ahmia(query, amount=amount)
        
        if not search_results:
            print(f"{Colors.BOLD}{Colors.R}[!] No intelligence pointers found on Ahmia.{Colors.END}")
            return

        print(f"{Colors.BOLD}[+] Discovered {len(search_results)} matching targets. Processing...{Colors.END}\n")

        for idx, res in enumerate(search_results, start=1):
            if scrape_sites:
                # Deep Scrape
                result = self.scraper.scrape_onion(
                    url=res['url'], 
                    primary_keyword=query,
                    include_images=scrape_images,
                    use_js=use_js
                )
                if result:
                    self._print_result(idx, result)
                else:
                    print(f"{Colors.BOLD}{idx}. [!] Unreachable Vector: {Colors.O}{res['url']}{Colors.END}")
            else:
                # Shallow Search Result
                print(f"{Colors.BOLD}{idx}. [>] Vector: {Colors.END}{Colors.P}{res['title']}{Colors.END}")
                print(f"{Colors.BOLD}| URL: {Colors.END}{Colors.G}{res['url']}{Colors.END}")
                print(f"{Colors.BOLD}| INFO: {Colors.END}{Colors.W}{res['description'][:150]}...{Colors.END}\n")


    def crawl(self, query, amount, use_proxy=False, scrape_sites=False, scrape_images=False, debug_mode=False):
        headers = {'User-Agent': random.choice(Headers.user_agents)}
        proxy_config = {'http': 'socks5h://localhost:9050', 'https': 'socks5h://localhost:9050'} if use_proxy else {}

        # Fetching the initial search page
        try:
            homepage = requests.get(Configuration.__darkdump_base__, headers=headers)
            if homepage.status_code != 200:
                raise Exception(f"Couldn't fetch {Configuration.__darkdump_base__} code {homepage.status_code}")

            soup = BeautifulSoup(homepage.content, 'html.parser')
            nonce_el = soup.select_one('#searchForm input[type="hidden"]')
            if nonce_el is None:
                raise Exception("Couldn't find nonce in HomePage")

            nonce = f"&{nonce_el.attrs["name"]}={nonce_el.attrs["value"]}"
            url = Configuration.__darkdump_api__ + query + nonce
            page = requests.get(url, headers=headers)
            if page.status_code != 200:
                raise Exception(f"Couldn't fetch {url} code {page.status_code}")

            soup = BeautifulSoup(page.content, 'html.parser')
            results = soup.find(id='ahmiaResultsPage')  # Adjust based on actual result container ID
            if results is None:
                raise Exception(f"Couldn't extract results from {url}")

            second_results = results.find_all('li', class_='result')  # Adjust based on actual results tag and class
            if any([result is None for result in results]):
                raise Exception(f"Couldn't parse a result from {url}")

        except Exception as e:
            print(f"{Colors.BOLD + Colors.R} Error in fetching Ahmia.fi: {e} {Colors.END}")
            return

        seen_urls = set()  # This set will store URLs to avoid duplicates

        if scrape_sites: 
            if Platform(True).check_tor_connection(proxy_config) == False: return

        for idx, result in enumerate(second_results[:min(amount + 1, len(second_results))], start=1):
            site_url = result.find('cite').text
            if "http://" not in site_url and "https://" not in site_url:
                site_url = "http://" + site_url

            if site_url in seen_urls:
                continue
            seen_urls.add(site_url)
            
            title = result.find('a').text if result.find('a') else "No title available"
            description = result.find('p').text if result.find('p') else "No description available"
            try:
                if scrape_sites:
                    try:
                        site_response = requests.get(site_url, headers=headers, proxies=proxy_config)
                        site_soup = BeautifulSoup(site_response.content, 'html.parser')
                        text_analysis = self.analyze_text(site_soup.get_text())
                        metadata = self.extract_metadata(site_soup)
                        links = self.extract_links(site_soup)
                        emails = self.extract_emails(site_soup)
                        documents = self.extract_document_links(site_soup)

                        if scrape_images:
                            images = site_soup.find_all('img')
                            image_urls = [img['src'] for img in images if img.get('src')]
                            image_urls = [url if url.startswith('http') else site_url + url for url in image_urls]

                            html_path = self.generate_html(image_urls, site_url)
                            images_str = f"{Colors.BOLD}| Images Gallery: {Colors.END}{Colors.G}{os.path.abspath(html_path)}{Colors.END}\n"

                        print('-' * 50)
                        print(f"{Colors.BOLD}{idx + 1}.\n --- [+] Website: {Colors.END}{Colors.P}{title.strip()}{Colors.END}")
                        print(f"{Colors.BOLD}| Information: {Colors.END}{Colors.G}{description.strip()}{Colors.END}")
                        print(f"{Colors.BOLD}| Onion Link: {Colors.END}{Colors.G}{site_url}{Colors.END}")
                        print(f"{Colors.BOLD}| Keywords: {Colors.END}{Colors.G}{', '.join(self.extract_keywords(site_soup.get_text()))}{Colors.END}")
                        print(f"{Colors.BOLD}\t- Sentiment: Polarity = {text_analysis['sentiment']['polarity']:.2f}, Subjectivity = {text_analysis['sentiment']['subjectivity']:.2f}")
                        print(f"{Colors.BOLD}| Metadata: {Colors.END}{Colors.G}{json.dumps(metadata)}{Colors.END}")
                        print(f"{Colors.BOLD}| Links Found: {Colors.END}{Colors.G}{len(links)}{Colors.END}")
                        print(f"{Colors.BOLD}| Emails Found: {Colors.END}{Colors.G}{', '.join(emails) if emails else 'No emails found.'}{Colors.END}")
                        print(f"{Colors.BOLD}| Documents Found: {Colors.END}{Colors.G}{', '.join(documents) if documents else 'No document links found.'}{Colors.END}")

                        if scrape_images:
                            if image_urls:
                                print(images_str)
                            else: print(f"{Colors.BOLD + Colors.GR} No images found. Skipping parse. {Colors.END}")

                    except Exception as e:
                        print(f"{Colors.BOLD + Colors.O} Dead onion, skipping...: {site_url} {Colors.END}")
                        if debug_mode:
                            print(f"{Colors.BOLD + Colors.R}[DEBUG] Exception: {e}{Colors.END}")
	
                else: # No scrape
                    print(f"{Colors.BOLD}{idx + 1}. --- [+] Website: {Colors.END}{Colors.P}{title.strip()}{Colors.END}")
                    print(f"{Colors.BOLD}\t Information: {Colors.END}{Colors.G}{description.strip()}{Colors.END}")
                    print(f"{Colors.BOLD}| Onion Link: {Colors.END}{Colors.G}{site_url}{Colors.END}\n")


            except KeyboardInterrupt as ki:
                print(f"{Colors.BOLD + Colors.R} Quitting... {Colors.END}")


def darkdump_main():
    clr = Colors()
    bn = Banner()

    Platform(True).clean_screen()
    Platform(True).get_operating_system_descriptor()
    bn.LoadDarkdumpBanner()
    print(notice)

    parser = argparse.ArgumentParser(description="Darkdump Optimized - AI-Powered Deep Web Intelligence")
    parser.add_argument("-v", "--version", help="returns darkdump's version", action="store_true")
    parser.add_argument("-q", "--query", help="the keyword or string you want to search on the deepweb", type=str)
    parser.add_argument("-u", "--url", help="directly scrape a specific .onion URL for intelligence", type=str)
    parser.add_argument("-a", "--amount", help="the amount of results you want to retrieve", type=int, default=10)
    parser.add_argument("-p", "--proxy", help="use tor proxy for scraping", action="store_true")
    parser.add_argument("-i", "--images", help="scrape images and visual content from the site", action="store_true")
    parser.add_argument("-j", "--js", help="enable JavaScript rendering (Playwright) for complex sites", action="store_true", default=None)
    parser.add_argument("-d", "--debug", help="enable debug output", action="store_true")

    args = parser.parse_args()

    if args.version:
        print(Colors.BOLD + Colors.B + f"Darkdump Optimized Version: {__version__}\n" + Colors.END)
        return

    # Initialize Darkdump with proxy setting
    dd = Darkdump(use_proxy=args.proxy)

    if args.url:
        print(f"Direct Intelligence Extraction Mode Active.\n")
        dd.scrape_direct(args.url, scrape_images=args.images, use_js=args.js)
    elif args.query:
        print(f"Searching For: {args.query} and showing {args.amount} results...\n")
        # For search results, we use JS-rendering if explicitly requested
        dd.crawl(args.query, args.amount, use_proxy=args.proxy, scrape_sites=args.scrape, scrape_images=args.images, use_js=args.js)
    else:
        print("[~] Note: Use -q for search or -u for direct URL scraping. See --help for details.")

if __name__ == "__main__":
    darkdump_main()
