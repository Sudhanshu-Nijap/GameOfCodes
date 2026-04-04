import os
import datetime
from pymongo import MongoClient
from pymongo.errors import ConfigurationError
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

# ── MongoDB Config ────────────────────────────────────────────────────────────
MONGO_URL = os.getenv("MONGODB_URI", "mongodb+srv://sudhanshun10b3720_db_user:Sudhu%402005@cluster0.d6wfgzt.mongodb.net/?appName=Cluster0")
DB_NAME = "darkdump"

# Collection Names
DISCOVERY_COLLECTION = "discovery_results"
TASKS_COLLECTION = "search_tasks"
INTEL_COLLECTION = "intel_reports"
USERS_COLLECTION = "users"

# Singleton-like lazy initialization
_client = None
_db = None
_db_error = None

def get_client():
    global _client, _db_error
    
    # If client exists, check if it's still alive
    if _client is not None:
        try:
            _client.admin.command('ping')
            return _client
        except Exception:
            print("[MongoDB] Connection lost. Re-establishing...")
            _client = None

    if _client is None:
        try:
            # Note: Requires 'dnspython' for +srv records
            _client = MongoClient(
                MONGO_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=5000,
                appName="DarkWebIntel"
            )
            # Force a ping to verify connection exists
            _client.admin.command('ping')
            _db_error = None
        except ConfigurationError as e:
            _db_error = f"Database Configuration Error: {str(e)}"
            print(f"\n[CRITICAL ERROR] MongoDB DNS Failure: {e}")
            return None
        except Exception as e:
            _db_error = f"Database Connection Error: {str(e)}"
            print(f"[ERROR] Database connection failed: {e}")
            return None
    return _client

def get_db():
    global _db
    client = get_client()
    if client is not None:
        if _db is None:
            _db = client[DB_NAME]
        return _db
    return None

def get_collection(name=DISCOVERY_COLLECTION):
    db = get_db()
    if db is not None:
        return db[name]
    return None

def get_tasks_collection():
    return get_collection(TASKS_COLLECTION)

def get_intel_collection():
    return get_collection(INTEL_COLLECTION)

def get_users_collection():
    return get_collection(USERS_COLLECTION)

def get_status():
    """Returns the current database status for the stats API."""
    if _db_error:
        return {"status": "error", "message": _db_error}
    if _client is not None:
        return {"status": "connected"}
    return {"status": "connecting"}

def init_indexes():
    try:
        db = get_db()
        if db is not None:
            # discovery_results indexes
            disc = db[DISCOVERY_COLLECTION]
            disc.create_index("url", unique=True)
            disc.create_index("crawl_hash")
            disc.create_index("timestamp")

            # search_tasks indexes
            tasks = db[TASKS_COLLECTION]
            tasks.create_index("id", unique=True)
            tasks.create_index("status")
            tasks.create_index("timestamp")

            # intel_reports indexes
            intel = db[INTEL_COLLECTION]
            intel.create_index("url", unique=True)
            intel.create_index("timestamp")

            # users indexes
            users = db[USERS_COLLECTION]
            users.create_index("email", unique=True)

            print("[MongoDB] Indexes verified/created across all collections.")
    except Exception as e:
        print(f"[WARN] Could not create MongoDB indexes: {e}")
