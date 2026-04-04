import os
import sys
from dotenv import load_dotenv

# Add backend and services to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
sys.path.append(os.path.join(os.getcwd(), 'backend', 'services'))

load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

print(f"DEBUG: GROQ_API_KEY present: {bool(os.getenv('GROQ_API_KEY'))}")

try:
    from scrap_info_process import scrap_info_process
    from intel_analyzer import analyze_scraped_content
    
    test_text = "This is a sample leaked database for Acme Corp. It contains emails like admin@acme.com and mentions sensitive financial records."
    print("\n--- Testing scrap_info_process directly ---")
    result = scrap_info_process(test_text)
    print(f"Result Type: {type(result)}")
    print(f"Summary: {result.get('summary')}")
    print(f"Risk Score: {result.get('risk_score')}")
    
    print("\n--- Testing analyze_scraped_content wrapper ---")
    wrapped_result = analyze_scraped_content(test_text)
    print(f"Wrapped Summary: {wrapped_result.get('summary')}")
    
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error during test: {e}")
