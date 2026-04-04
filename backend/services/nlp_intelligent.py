import os
import json
import requests

# Reuse the API key from environment
api_key = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """
You are an organization data breach analyzer.

Users will ask about any kind of data leak or exposure related to their organization.
This includes emails, credentials, documents, employee info, financial data, source code, API keys, anything.

Extract their intent and return ONLY valid JSON.
IMPORTANT RULES:
1. Extract the main specific target data the user is looking for.
2. If the user is asking about databases, server backups, SQL dumps, or infrastructure info, set 'target_words' to "database".
3. If the user is asking about emails, webmail, login credentials, or account leaks, set 'target_words' to "email accounts".
4. If neither, use a concise 1-2 word target (e.g., "API keys", "source code").
5. Extract the 'organization' the data belongs to (if mentioned, e.g., "acme.com", "Google", "OurCompany").
6. 'target_words' and 'organization' should be STRINGS.
7. NEVER combine targets (e.g., "database and emails"). Pick the primary one.
8. Only return JSON.

OUTPUT FORMAT:
{
  "search_type": "what type of data they are looking for",
  "target_words": "primary target keyword (preferably 'database' or 'email accounts')",
  "organization": "the company/domain/organization name (or empty if not specified)",
  "urgency": "low | medium | high | critical",
  "user_intent": "one line of what they want to find",
  "related_terms": ["array of 2-3 similar terms to the target_words"]
}

EXAMPLES:

Input: "are our company emails leaked for acme.com?"
Output: {"search_type": "email", "target_words": "email accounts", "organization": "acme.com", "urgency": "high", "user_intent": "check if company emails appear in known data breaches", "related_terms": ["email credentials", "webmail leak"]}

Input: "is our user database exposed for google.com?"
Output: {"search_type": "database", "target_words": "database", "organization": "google.com", "urgency": "critical", "user_intent": "verify if user database exists on dark web marketplaces", "related_terms": ["sql dump", "user collection"]}
"""

def process_nlp_input(user_input: str) -> dict:
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
            {"role": "user", "content": user_input}
        ],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        raw = data["choices"][0]["message"]["content"]
        return json.loads(raw)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
