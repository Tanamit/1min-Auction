import hashlib
import uuid
from Service.db_connection import get_supabase_client
from datetime import datetime, timezone

# Get the Supabase client instance
supabase = get_supabase_client()

def hash_md5(password: str) -> str:
    """Hashes a string using MD5 and returns the hexadecimal digest."""
    return hashlib.md5(password.encode('utf-8')).hexdigest()

def create_new_user(
    username: str, 
    email: str, 
    password: str,
    first_name: str,
    last_name: str,
    address: str
) -> dict:
    """
    Inserts a new user record into the 'users' table in Supabase.
    """
    # 1. Check if user already exists (by email)
    existing_user_response = supabase.table('users').select('user_id').eq('user_email', email).execute()
    
    if existing_user_response.data:
        return {"status": "error", "message": "User with this email already exists."}

    # 2. Generate a random UUID
    new_user_id = str(uuid.uuid4())
    
    # 3. Hash the password
    hashed_password = hash_md5(password)

    # 4. Insert the new user
    try:
        data_to_insert = {
            "user_id": new_user_id,
            "user_name": username,
            "user_email": email,
            "password": hashed_password,
            "role_id": 3,
            "first_name": first_name,
            "last_name": last_name,
            "address": address,
            "created_at": datetime.utcnow().isoformat(),
            "update_at": None,
            "deleted_at": None,
            "verify_img": None
        }

        insert_response = supabase.table('users').insert(data_to_insert).execute()
        
        if insert_response.data and len(insert_response.data) > 0:
            return {"status": "success", "message": "Account created successfully.", "user_id": new_user_id}
        else:
            return {"status": "error", "message": "Failed to create account (No data returned from insert)."}
        
    except Exception as e:
        print(f"Database error during user creation: {e}")
        return {"status": "error", "message": f"Database error: {e}"}
# End of CreateAccountModel.py
