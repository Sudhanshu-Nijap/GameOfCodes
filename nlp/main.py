from dotenv import load_dotenv
import json
load_dotenv()
import os 
from groq import Groq

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

def ask_groq(user_input):
    response = client.chat.completions.create(
        model="qwen/qwen3-32b",
        messages=[
            {
                "role": "system",
                "content": """You are a search query analyzer.
                Analyze the user query and return ONLY a JSON object with:
                - intent: what the user wants
                - keywords: list of main keywords
                - related_terms: similar terms to search
                - category: type of content
                No explanation, no markdown, JSON only."""
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


print(json.dumps(ask_groq("find hacking tools"), indent=2))


