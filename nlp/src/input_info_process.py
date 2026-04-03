import os
from groq import Groq
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
load_dotenv()
import json
api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key)

SYSTEM_PROMPT = """
You are an organization data breach analyzer.

Users will ask about any kind of data leak or exposure related to their organization.
This includes emails, credentials, documents, employee info, financial data, source code, API keys, anything.

Extract their intent and return ONLY valid JSON.

OUTPUT FORMAT:
{
  "search_type": "what type of data they are looking for",
  "targets": ["identifiers mentioned — emails, domains, names, IPs, etc."],
  "urgency": "low | medium | high | critical",
  "related_terms": ["similar terms that could be relevant to search for"],
  "user_intent": "one line of what they want to find"
}

EXAMPLES:

Input: "are our company emails leaked?"
Output: {"search_type": "email", "targets": ["company emails"], "urgency": "high", "user_intent": "check if company emails appear in known data breaches"}

Input: "check if our API keys or source code is exposed anywhere"
Output: {"search_type": "source code / API keys", "targets": ["API keys", "source code"], "urgency": "critical", "user_intent": "find exposed API keys or source code repositories"}

Input: "is our employee database or HR records leaked for acme.com"
Output: {"search_type": "employee data", "targets": ["acme.com", "employee database", "HR records"], "urgency": "critical", "user_intent": "check if employee or HR data from acme.com is exposed"}
"""

def input_info_process(user_input):
    response = client.chat.completions.create(
        model="moonshotai/kimi-k2-instruct-0905",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_input
            }
        ]
    )
    raw = response.choices[0].message.content

    try:
        result = json.loads(raw)
        return result
    except json.JSONDecodeError:
        return {"error": "Invalid JSON", "raw": raw}

app = FastAPI()

class InputBody(BaseModel):
    text: str

@app.post('/analyze')
async def analyze(body: InputBody):
    result = input_info_process(body.text)
    return result  