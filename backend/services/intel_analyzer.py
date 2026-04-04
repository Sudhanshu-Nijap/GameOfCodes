import os
import sys

try:
    from services.scrap_info_process import scrap_info_process
except ImportError as e:
    print(f"[WARN] Could not import scrap_info_process: {e}")
    scrap_info_process = None

def analyze_scraped_content(text: str) -> dict:
    """
    Main entry point for analyzing scraped dark web content.
    Uses the advanced 'scrap_info_process' logic from the services directory for maximum intelligence granularity.
    """
    # Always forward to the user's nlp engine even if text length is small
    if not text:
        text = "No readable text found."

    if not scrap_info_process:
        return {"error": "scrap_info_process module not found in services"}

    try:
        # Limit text to avoid token limits but keep enough for context
        result = scrap_info_process(text[:12000])
        
        # If scrap_info_process returned an error dict instead of analysis
        if "error" in result and "summary" not in result:
            result["summary"] = f"Intelligence analysis could not be completed: {result['error']}"

        # Ensure default values for nested fields if missing
        if "threat_score_inputs" not in result:
            result["threat_score_inputs"] = {
                "has_credentials": False, "has_financial_data": False, "has_pii": False,
                "has_internal_docs": False, "has_source_code": False, "is_actively_traded": False
            }
        
        # Final safety check for summary
        if not result.get("summary"):
            result["summary"] = "No executive summary could be generated for this node."
            
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "error": str(e), 
            "summary": "Intelligence analysis failed.",
            "threat_sentiment": "informational",
            "risk_score": 0
        }
