from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.Service.db_connection import get_supabase_client, run_sql

router = APIRouter(prefix="/admin", tags=["Admin"])

class RoleUpdateIn(BaseModel):
    role: str

@router.get("/users")
def list_users():
    try:
        db_resp = run_sql("SELECT user_id, user_name, user_email, role_id, created_at FROM users ORDER BY user_name")

        # 1. DB error?
        if db_resp.get("status") != "ok":
            raise Exception(db_resp.get("error", "Unknown DB error"))

        # 2. actual row data
        rows = db_resp.get("rows", [])

        ROLE_MAP = {
            1: "admin",
            2: "seller",
            3: "buyer",
        }

        result = []
        for r in rows:
            print("User row:", r)
            user = {
                "user_id": r.get("user_id"),
                "name": r.get("user_name"),
                "email": r.get("user_email"),
                "role": ROLE_MAP.get(r.get("role_id"), ""),
                "created_at": r.get("created_at"),
            }
            result.append(user)

        result.sort(key=lambda u: (u["name"] or "").lower())
        return result

    except Exception as e:
        print("ERROR in /admin/users:", e)
        raise HTTPException(status_code=500, detail=str(e))



@router.put("/users/{user_id}/role")
def update_role(user_id: str, body: RoleUpdateIn):
    try:
        new_role_text = body.role
        ALLOWED = {"admin", "seller", "buyer"}
        if new_role_text not in ALLOWED:
            raise HTTPException(status_code=400, detail="Invalid role")

        ROLE_CODE_MAP = {
            "admin": 1,
            "seller": 2,
            "buyer": 3,
        }
        role_code = ROLE_CODE_MAP[new_role_text]

        sql = f"UPDATE users SET role_id = {role_code} WHERE user_id = '{user_id}'"
        result = run_sql(sql)

        if result.get("error"):
            raise Exception(result["error"])

        return {"ok": True, "user_id": user_id, "role": new_role_text}

    except Exception as e:
        print("ERROR in update_role:", e)
        raise HTTPException(status_code=500, detail=str(e))




@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    try:
        sql = f"DELETE FROM users WHERE user_id = '{user_id}'"
        result = run_sql(sql)

        if result.get("error"):
            raise Exception(result["error"])

        return {"ok": True, "user_id": user_id}

    except Exception as e:
        print("ERROR in delete_user:", e)
        raise HTTPException(status_code=500, detail=str(e))


