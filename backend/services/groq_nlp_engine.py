import os
import json
import time
import requests
from typing import Dict, Optional

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You are an advanced semantic query processor running on the Groq LLM inference platform.

Your task is to transform raw user input into structured search parameters with high accuracy and consistency.

---

## CORE RULE (MANDATORY):
* The "primary_keyword" MUST ALWAYS be an ORGANIZATION.
* Valid organizations include: companies, platforms, institutions, services, brands.
* NEVER return a person, generic noun, or abstract concept.

---

## ENTITY RESOLUTION RULES:
1. Normalize entity names:
   * Remove possessive forms ("YouTube's" -> "YouTube")
   * Convert plurals to singular
   * Standardize casing
2. If multiple organizations exist:
   * Select the MOST RELEVANT / DOMINANT one
3. If NO organization is explicitly mentioned:
   * Infer the most likely parent organization from context
   Examples:
   * gmail -> Google
   * youtube -> YouTube
   * instagram -> Meta
   * whatsapp -> Meta
   * aws -> Amazon
4. If still unclear:
   * Set "primary_keyword" to "unknown_organization"

---

## SECONDARY KEYWORDS (INTENT EXTRACTION):
* Extract ONLY meaningful intent keywords
* Ignore filler words (e.g., "I want", "show me", "give", etc.)

---

## SEMANTIC EXPANSION RULE:
For each keyword:
* Generate EXACTLY 3-4 highly relevant synonyms
* Focus on:
  * cybersecurity
  * data breaches
  * leaks
  * credentials
  * infrastructure
* Avoid generic or vague terms

---

## NORMALIZATION RULES:
* Convert plural -> singular
* Remove stopwords implicitly
* Preserve only meaningful words
* Keep query concise and structured

---

## OUTPUT FORMAT (STRICT JSON ONLY):
{
"primary_keyword": "<organization name>",
"secondary_keywords": [
{
"term": "<keyword>",
"expanded_terms": ["<syn1>", "<syn2>", "<syn3>"]
}
],
"normalized_query": "<cleaned query>",
"intent": "<clear, concise one-line intent>"
}

---

## HARD CONSTRAINTS:
* ALWAYS return valid JSON
* DO NOT include explanations
* DO NOT include markdown
* DO NOT include extra text
* DO NOT exceed 4 expanded terms per keyword
* DO NOT hallucinate unrelated organizations
* Prefer well-known real-world organizations

---

## GROQ-SPECIFIC EXECUTION BEHAVIOR:
* Optimize for low-latency inference (Groq environment)
* Be deterministic and consistent
* Avoid unnecessary verbosity
* Prioritize precise structured output over creativity
* Ensure stable JSON formatting across repeated calls"""

class GroqNLPEngine:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GroqNLPEngine, cls).__new__(cls)
            cls._instance.api_key = os.environ.get("GROQ_API_KEY", "")
            # We use Llama 3.3 70b versatile for high accuracy in structured reasoning.
            cls._instance.model = "llama-3.3-70b-versatile" 
        return cls._instance

    def parse_query(self, query: str) -> Dict:
        """
        Main pipeline to convert natural language into {primary, secondary} using Groq API.
        Returns the format compatible with the rest of the application.
        """
        start_time = time.time()
        
        if not self.api_key:
            print("WARNING: GROQ_API_KEY environment variable not set. Falling back to simple parsing.")
            return self._fallback_parse(query, start_time)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": query}
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed_json = json.loads(content)
            
            # Map the parsed JSON back to the application expected format
            primary = parsed_json.get("primary_keyword", "unknown_organization")
            
            expanded_secondary = []
            original_secondary = []
            
            # Smartly pick top synonyms to include in the physical search query
            # Limits to ~2 synonyms per term to keep query length manageable
            search_keywords = []

            for sec in parsed_json.get("secondary_keywords", []):
                term = sec.get("term", "")
                if term:
                    original_secondary.append(term)
                    expanded_secondary.append(term)
                    search_keywords.append(term)
                    
                    synonyms = sec.get("expanded_terms", [])
                    expanded_secondary.extend(synonyms)
                    
                    # Add Top-1 synonym to the search engine query
                    if synonyms:
                        search_keywords.append(synonyms[0])
            
            # Remove duplicates while preserving some order
            expanded_secondary = list(dict.fromkeys(expanded_secondary))
            search_keywords = list(dict.fromkeys(search_keywords))
            
            if primary.lower() in [w.lower() for w in expanded_secondary]:
                expanded_secondary.remove(primary.lower())
                
            # Optimized full-text search query
            search_query = f"{primary} {' '.join(search_keywords[:5])}".strip()
            
            return {
                "primary": primary.lower(),
                "secondary": expanded_secondary,
                "ahmia_query_keywords": search_keywords[:5],
                "search_query": search_query,
                "confidence_score": 0.95, # High confidence for LLM
                "processing_time_ms": round((time.time() - start_time) * 1000, 2),
                "metadata": {
                    "engine": "Groq LLM Semantic Alignment",
                    "intent": parsed_json.get("intent", ""),
                    "normalized_query": parsed_json.get("normalized_query", "")
                }
            }
            
        except Exception as e:
            print(f"[GroqNLPEngine] Error querying Groq API: {e}")
            return self._fallback_parse(query, start_time)

    def _fallback_parse(self, query: str, start_time: float) -> Dict:
        """Simple fallback if Groq fails or no API key is provided."""
        words = query.split()
        primary = words[0].lower() if words else "service"
        secondary = [w.lower() for w in words[1:4]] if len(words) > 1 else []
        
        return {
            "primary": primary,
            "secondary": secondary,
            "ahmia_query_keywords": secondary,
            "confidence_score": 0.4,
            "processing_time_ms": round((time.time() - start_time) * 1000, 2),
            "metadata": {"engine": "Groq Error Fallback"}
        }

# Singleton instance
groq_nlp_engine = GroqNLPEngine()
