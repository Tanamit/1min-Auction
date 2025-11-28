from Service.db_connection import get_supabase_client
from datetime import datetime

# Initialize Supabase client
supabase = get_supabase_client()

def update_buyer_profile(
    user_id: str,
    user_email: str,
    user_name: str,
    first_name: str,
    last_name: str,
    address: str,
    create_date: str | None = None,
    verify_img: str | None = None
) -> dict:
    """
    Updates a buyer's profile data in the 'users' table.
    """

    try:
        # 1. Check if the user exists
        user_check = supabase.table("users").select("*").eq("user_id", user_id).execute()
        if not user_check.data:
            return {"status": "not_found", "message": "User not found."}

        # 2. Prepare data for update
        update_data = {
            "user_email": user_email,
            "user_name": user_name,
            "first_name": first_name,
            "last_name": last_name,
            "address": address,
            "verify_img": verify_img,
            "update_at": datetime.utcnow().isoformat()
        }

        # Optional create_date sync (only if frontend sends it)
        if create_date:
            update_data["created_at"] = create_date

        # 3. Execute the update
        response = supabase.table("users").update(update_data).eq("user_id", user_id).execute()

        if response.data and len(response.data) > 0:
            return {
                "status": "success",
                "message": "Profile updated successfully.",
                "user": response.data[0]
            }
        else:
            return {"status": "error", "message": "No data returned after update."}

    except Exception as e:
        print(f"Database error while updating buyer profile: {e}")
        return {"status": "error", "message": str(e)}
