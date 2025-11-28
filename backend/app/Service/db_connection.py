import os
import json
from typing import Any, Dict, List
from supabase import create_client, Client

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Config.json")

with open(CONFIG_PATH) as f:
    config = json.load(f)

SUPABASE_URL = config["SUPABASE_URL"]
SUPABASE_KEY = config["SUPABASE_KEY"]

print("SUPABASE_URL =", SUPABASE_URL)
print("SUPABASE_KEY starts with =", SUPABASE_KEY[:10])

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_client() -> Client:
    return supabase

from typing import Any, Dict, List

def run_sql(query: str) -> Dict[str, Any]:
    print("Executing SQL query:", query)
    resp = supabase.rpc("exec_sql", {"q": query}).execute()

    data = resp.data 
    if data is None:
        return {"status": "error", "error": "No data returned from exec_sql"}

    if not isinstance(data, dict):
        return {"status": "error", "error": "Unexpected shape from exec_sql", "raw": data}

    return data
