import os
import sys
import uuid
import datetime
from dotenv import load_dotenv

# Add the current directory to sys.path so we can import from backend modules
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'backend')))

from database import get_users_collection
from services.auth import get_password_hash

def manual_signup():
    load_dotenv('backend/.env')
    
    user_data = {
        "id": str(uuid.uuid4()),
        "first_name": "SUDHANSHU",
        "last_name": "NIJAP",
        "organization_name": "UniteCore",
        "email": "sudhanshun10b3720@gmail.com",
        "password": get_password_hash("123456789"),
        "created_at": datetime.datetime.utcnow()
    }
    
    print(f"Connecting to MongoDB and registering user: {user_data['email']}...")
    
    users_coll = get_users_collection()
    if users_coll is None:
        print("CRITICAL: Could not connect to MongoDB. Check your MONGODB_URI in backend/.env")
        return

    # Check if user already exists
    if users_coll.find_one({"email": user_data["email"]}):
        print(f"User with email {user_data['email']} is already registered.")
        return

    try:
        users_coll.insert_one(user_data)
        print(f"SUCCESS: User '{user_data['first_name']} {user_data['last_name']}' has been registered in the 'users' collection.")
    except Exception as e:
        print(f"FAILED: An error occurred during insertion: {e}")

if __name__ == "__main__":
    manual_signup()
