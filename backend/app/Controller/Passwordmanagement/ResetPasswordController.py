from fastapi import APIRouter, HTTPException, status
import sys
import os

# ensure service path
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from app.Service.Passwordmanagement.password_service import PasswordService
from app.Model.User import ResetPasswordRequest

router = APIRouter(
    prefix="/api/users/password",
    tags=["PasswordManagement"]
)


@router.post('/reset', status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest):
    """
    Reset password using the reset token from forgot password endpoint.
    """
    try:
        updated = PasswordService.reset_password(
            new_password=payload.new_password, 
            user_id=payload.user_id, 
            email=payload.email,
            token=payload.token
        )
        return {"message": "Password updated successfully", "user_id": updated.get('user_id')}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
