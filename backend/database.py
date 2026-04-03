import datetime
from pymongo import MongoClient
from pymongo.errors import ConfigurationError
from bson import ObjectId

# ── MongoDB Config ────────────────────────────────────────────────────────────
MONGO_URL = "mongodb+srv://sudhanshun10b3720_db_user:Sudhu%402005@cluster0.d6wfgzt.mongodb.net/?appName=Cluster0"
DB_NAME = "darkdump"
COLLECTION_NAME = "discovery_results"

# Singleton-like lazy initialization
_client = None
_db = None
_db_error = None

def get_client():
    global _client, _db_error
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
            print("Tip: Ensure 'dnspython' is installed: pip install dnspython")
            print("Tip: Check if your network/VPN blocks SRV records.\n")
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

def get_collection():
    db = get_db()
    if db is not None:
        return db[COLLECTION_NAME]
    return None

def get_status():
    """Returns the current database status for the stats API."""
    if _db_error:
        return {"status": "error", "message": _db_error}
    if _client is not None:
        return {"status": "connected"}
    return {"status": "connecting"}

def init_indexes():
    try:
        coll = get_collection()
        if coll is not None:
            coll.create_index("url", unique=True)
            coll.create_index("crawl_hash")
            coll.create_index("timestamp")
            print("[MongoDB] Indexes verified/created.")
    except Exception as e:
        print(f"[WARN] Could not create MongoDB indexes: {e}")
