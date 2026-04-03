// scraper.cpp
#include <iostream>
#include <string>
#include <vector>
#include <queue>
#include <set>
#include <fstream>
#include <curl/curl.h>
#include <gumbo.h>

// ── Config ─────────────────────────────────────────────
#define TOR_PROXY     "socks5h://127.0.0.1:9050"
#define MAX_PAGES     20       // max pages to crawl
#define MAX_DEPTH     3        // how deep to follow links
#define TIMEOUT       30L      // seconds per request

// ── Result Structure ───────────────────────────────────
struct PageResult {
    std::string url;
    std::string text;
    std::vector<std::string> links;
    std::vector<std::string> images;
};

// ── Callback for curl response ─────────────────────────
size_t WriteCallback(void* contents, size_t size,
                     size_t nmemb, std::string* output) {
    output->append((char*)contents, size * nmemb);
    return size * nmemb;
}

// ── Fetch a page via Tor ───────────────────────────────
std::string fetchPage(const std::string& url) {
    CURL* curl = curl_easy_init();
    std::string response;

    if (curl) {
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_PROXY, TOR_PROXY);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, TIMEOUT);
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
        curl_easy_setopt(curl, CURLOPT_USERAGENT, "Mozilla/5.0");

        CURLcode res = curl_easy_perform(curl);
        if (res != CURLE_OK) {
            std::cerr << "Curl error: "
                      << curl_easy_strerror(res) << std::endl;
        }
        curl_easy_cleanup(curl);
    }
    return response;
}

// ── Extract base URL ───────────────────────────────────
std::string getBaseUrl(const std::string& url) {
    size_t pos = url.find("//");
    if (pos == std::string::npos) return url;
    size_t end = url.find("/", pos + 2);
    if (end == std::string::npos) return url;
    return url.substr(0, end);
}

// ── Extract text from Gumbo node ──────────────────────
void extractText(GumboNode* node, std::string& text) {
    if (node->type == GUMBO_NODE_TEXT) {
        text += node->v.text.text;
        text += " ";
        return;
    }
    if (node->type != GUMBO_NODE_ELEMENT) return;

    // skip script and style tags
    if (node->v.element.tag == GUMBO_TAG_SCRIPT ||
        node->v.element.tag == GUMBO_TAG_STYLE) return;

    GumboVector* children = &node->v.element.children;
    for (unsigned int i = 0; i < children->length; i++) {
        extractText(static_cast<GumboNode*>(children->data[i]), text);
    }
}

// ── Extract links from Gumbo node ─────────────────────
void extractLinks(GumboNode* node,
                  std::vector<std::string>& links,
                  const std::string& baseUrl) {
    if (node->type != GUMBO_NODE_ELEMENT) return;

    if (node->v.element.tag == GUMBO_TAG_A) {
        GumboAttribute* href = gumbo_get_attribute(
            &node->v.element.attributes, "href");
        if (href) {
            std::string link = href->value;
            // make absolute URL
            if (link.substr(0, 4) != "http") {
                link = baseUrl + "/" + link;
            }
            // only keep .onion links
            if (link.find(".onion") != std::string::npos) {
                links.push_back(link);
            }
        }
    }

    GumboVector* children = &node->v.element.children;
    for (unsigned int i = 0; i < children->length; i++) {
        extractLinks(static_cast<GumboNode*>(
            children->data[i]), links, baseUrl);
    }
}

// ── Extract images from Gumbo node ────────────────────
void extractImages(GumboNode* node,
                   std::vector<std::string>& images,
                   const std::string& baseUrl) {
    if (node->type != GUMBO_NODE_ELEMENT) return;

    if (node->v.element.tag == GUMBO_TAG_IMG) {
        GumboAttribute* src = gumbo_get_attribute(
            &node->v.element.attributes, "src");
        if (src) {
            std::string imgUrl = src->value;
            if (imgUrl.substr(0, 4) != "http") {
                imgUrl = baseUrl + "/" + imgUrl;
            }
            images.push_back(imgUrl);
        }
    }

    GumboVector* children = &node->v.element.children;
    for (unsigned int i = 0; i < children->length; i++) {
        extractImages(static_cast<GumboNode*>(
            children->data[i]), images, baseUrl);
    }
}

// ── Parse HTML page ────────────────────────────────────
PageResult parsePage(const std::string& url,
                     const std::string& html) {
    PageResult result;
    result.url = url;

    std::string baseUrl = getBaseUrl(url);

    GumboOutput* output = gumbo_parse(html.c_str());

    extractText(output->root, result.text);
    extractLinks(output->root, result.links, baseUrl);
    extractImages(output->root, result.images, baseUrl);

    gumbo_destroy_output(&kGumboDefaultOptions, output);
    return result;
}

// ── Download image ─────────────────────────────────────
void downloadImage(const std::string& url,
                   const std::string& filename) {
    CURL* curl = curl_easy_init();
    if (curl) {
        FILE* fp = fopen(filename.c_str(), "wb");
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_PROXY, TOR_PROXY);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, NULL);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, fp);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, TIMEOUT);
        curl_easy_perform(curl);
        curl_easy_cleanup(curl);
        fclose(fp);
    }
}

// ── Save results to JSON ───────────────────────────────
void saveResults(const std::vector<PageResult>& results,
                 const std::string& outputFile) {
    std::ofstream out(outputFile);
    out << "{\n\"pages\": [\n";

    for (size_t i = 0; i < results.size(); i++) {
        out << "  {\n";
        out << "    \"url\": \"" << results[i].url << "\",\n";
        out << "    \"text\": \"" << results[i].text.substr(
                                        0, 5000) << "\",\n";

        // links
        out << "    \"links\": [";
        for (size_t j = 0; j < results[i].links.size(); j++) {
            out << "\"" << results[i].links[j] << "\"";
            if (j < results[i].links.size() - 1) out << ",";
        }
        out << "],\n";

        // images
        out << "    \"images\": [";
        for (size_t j = 0; j < results[i].images.size(); j++) {
            out << "\"" << results[i].images[j] << "\"";
            if (j < results[i].images.size() - 1) out << ",";
        }
        out << "]\n";

        out << "  }";
        if (i < results.size() - 1) out << ",";
        out << "\n";
    }
    out << "]\n}";
    out.close();
}

// ── Main Crawler ───────────────────────────────────────
int main(int argc, char* argv[]) {

    if (argc < 2) {
        std::cerr << "Usage: scraper <onion_url> [keywords]"
                  << std::endl;
        return 1;
    }

    std::string startUrl = argv[1];
    std::string keywords = (argc > 2) ? argv[2] : "";

    std::cout << "Starting crawl: " << startUrl << std::endl;
    std::cout << "Keywords: "       << keywords << std::endl;

    // crawl queue and visited set
    std::queue<std::pair<std::string, int>> toVisit; // url, depth
    std::set<std::string>                   visited;
    std::vector<PageResult>                 results;

    toVisit.push({startUrl, 0});

    curl_global_init(CURL_GLOBAL_ALL);

    while (!toVisit.empty() && results.size() < MAX_PAGES) {
        auto [url, depth] = toVisit.front();
        toVisit.pop();

        // skip already visited
        if (visited.count(url)) continue;
        visited.insert(url);

        std::cout << "[" << results.size() + 1 << "/"
                  << MAX_PAGES << "] Scraping: "
                  << url << std::endl;

        // fetch page
        std::string html = fetchPage(url);
        if (html.empty()) continue;

        // parse page
        PageResult page = parsePage(url, html);
        results.push_back(page);

        // download images
        for (size_t i = 0; i < page.images.size(); i++) {
            std::string filename = "img_" +
                std::to_string(results.size()) + "_" +
                std::to_string(i) + ".jpg";
            std::cout << "  Downloading image: "
                      << filename << std::endl;
            downloadImage(page.images[i], filename);
        }

        // add new links to queue
        if (depth < MAX_DEPTH) {
            for (const auto& link : page.links) {
                if (!visited.count(link)) {
                    toVisit.push({link, depth + 1});
                }
            }
        }
    }

    curl_global_cleanup();

    // save results
    saveResults(results, "results.json");
    std::cout << "\nDone! Scraped "  << results.size()
              << " pages."           << std::endl;
    std::cout << "Results saved to results.json" << std::endl;

    // print to stdout for FastAPI to read
    std::ifstream f("results.json");
    std::cout << f.rdbuf();

    return 0;
}