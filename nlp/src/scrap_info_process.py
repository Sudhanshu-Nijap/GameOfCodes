import os
from groq import Groq
from dotenv import load_dotenv
load_dotenv()
import json
from fastapi import FastAPI
from pydantic import BaseModel
api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key)

SYSTEM_PROMPT = """You are a dark web data analyzer for organizational threat intelligence.

You will receive raw scraped text from .onion sites that may contain leaked organizational data.
Analyze it and return ONLY valid JSON.

OUTPUT FORMAT:
{
  "data_types_found": ["emails | passwords | api_keys | employee_records | financial_data | source_code | documents | credentials | PII | other"],
  "affected_org": "organization name or domain if identifiable, else null",
  "sample_indicators": ["brief examples of what was found, no actual sensitive data"],
  "exposure_level": "partial | significant | full_dump",
  "data_volume": "low | medium | high",
  "freshness": "old | recent | unknown",
  "threat_score_inputs": {
    "has_credentials": true or false,
    "has_financial_data": true or false,
    "has_pii": true or false,
    "has_internal_docs": true or false,
    "has_source_code": true or false,
    "is_actively_traded": true or false
  },
  "summary": "2 line summary of what was found and how dangerous it is"
}"""

def scrap_info_process(user_input):
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
    result = scrap_info_process(body.text)
    return result 