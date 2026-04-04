import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """
You are a dark web data analyzer for organizational threat intelligence.

You will receive raw scraped text from .onion sites that may contain leaked organizational data.
Analyze it and return ONLY valid JSON.

Sentiment Definitions:
- 'hostile': Target extortion, active blackmail, or intentional harmful leaks.
- 'informational': News report, index listing, or random data archive.
- 'targeted_leak': A specific breach or dump aimed at a particular company.
- 'opportunistic': General credential harvesting or accidental exposures.

OUTPUT FORMAT:
{
  "data_types_found": ["emails", "passwords", "etc"],
  "threat_sentiment": "hostile | informational | targeted_leak | opportunistic",
  "sentiment_score": 0-100,
  "affected_org": "organization name or domain",
  "exposure_level": "partial | significant | full_dump",
  "data_volume": "low | medium | high",
  "freshness": "old | recent | unknown",
  "risk_score": 0-100,
  "threat_score_inputs": {
    "has_credentials": true|false,
    "has_financial_data": true|false,
    "has_pii": true|false,
    "has_internal_docs": true|false,
    "has_source_code": true|false,
    "is_actively_traded": true|false
  },
  "summary": "2 line executive summary of findings",
  "detailed_analysis": "Deep dive into what exactly was found (max 150 words)"
}
"""

def scrap_info_process(text: str) -> dict:
    if not api_key:
        return {"error": "GROQ_API_KEY is not set"}
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text}
        ],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=25)
        response.raise_for_status()
        
        data = response.json()
        raw = data["choices"][0]["message"]["content"]
        
        # Robustly strip markdown json blocks
        clean_json = raw.strip()
        if clean_json.startswith('```json'):
            clean_json = clean_json[7:]
        if clean_json.startswith('```'):
            clean_json = clean_json[3:]
        if clean_json.endswith('```'):
            clean_json = clean_json[:-3]
            
        try:
            # Try to parse the cleaned JSON
            result = json.loads(clean_json.strip())
            if not isinstance(result, dict):
                return {"error": "AI returned non-dictionary response", "raw": raw}
            return result
        except json.JSONDecodeError:
            # Fallback - try to find any JSON-like structure in the raw text if cleanup failed
            import re
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except: pass
            return {"error": "Invalid JSON mapping", "raw": raw}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}