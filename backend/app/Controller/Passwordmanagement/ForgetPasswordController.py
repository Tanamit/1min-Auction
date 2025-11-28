from fastapi import APIRouter, HTTPException, status
import sys
import os

# ensure service path
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from app.Service.Passwordmanagement.password_service import PasswordService
from app.Model.User import ForgetPasswordRequest

router = APIRouter(
    prefix="/api/users/password",
    tags=["PasswordManagement"]
)


@router.post('/forgot', status_code=status.HTTP_200_OK)
def forgot_password(payload: ForgetPasswordRequest):
    """
    Simplified forgot password - just confirm user exists.
    No token generation needed.
    """
    try:
        from app.Service.db_connection import get_supabase_client
        supabase = get_supabase_client()
        
        # Find user to confirm they exist
        query = supabase.table('users').select('user_id, user_email')
        if payload.user_id:
            response = query.eq('user_id', payload.user_id).execute()
        elif payload.email:
            response = query.eq('user_email', payload.email).execute()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either user_id or email is required"
            )
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user = response.data[0]
        return {"message": "User found. You can proceed to reset your password.", "user_id": user['user_id']}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Forgot password error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
