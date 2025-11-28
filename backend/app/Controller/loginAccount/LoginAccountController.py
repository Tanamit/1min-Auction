from fastapi import APIRouter, HTTPException, status
from app.Model.User import UserLogin, LoginResponse, UserResponse, EditUserProfileRequest
import sys
import os

# เพิ่ม path สำหรับ import Service
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from Service.auth_service import AuthService

router = APIRouter(
    prefix="/api/users",
    tags=["Authentication"]
)

@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(credentials: UserLogin):
    """
    Login endpoint
    
    Args:
        credentials: UserLogin object ที่มี email และ password
        
    Returns:
        LoginResponse ที่มี user data, token, และ message
        
    Raises:
        HTTPException 401: ถ้า email หรือ password ไม่ถูกต้อง
        HTTPException 500: ถ้ามี internal server error
    """
    try:
        # เรียกใช้ AuthService เพื่อตรวจสอบ login
        user = await AuthService.login_user(
            credentials.email, 
            credentials.password
        )
        
        # ถ้าไม่พบ user หรือ password ไม่ถูกต้อง
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # สร้าง token
        token = AuthService.generate_token(user['user_id'])
        
        # สร้าง UserResponse (ใช้ user_email และ user_name)
        user_response = UserResponse(
            user_id=user['user_id'],
            user_email=user['user_email'],  # แก้จาก email เป็น user_email
            user_name=user.get('user_name', ''),  # แก้จาก username เป็น user_name
            address=user.get('address', ''),
            create_date=user.get('created_at', ''),
            first_name=user.get('first_name', ''),
            last_name=user.get('last_name', ''),
            role_id=user['role_id'],
            verify_img=user.get('verify_img', '')
        )
        
        # Return LoginResponse
        return LoginResponse(
            user=user_response,
            token=token,
            message="Login successful"
        )
        
    except HTTPException:
        # ส่ง HTTPException ต่อไป
        raise
        
    except Exception as e:
        # Log error และส่ง 500 Internal Server Error
        print(f"Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
        
    # ✅ Route สำหรับ update user
@router.put("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
def edit_user_profile(user_id: str, credentials: EditUserProfileRequest):
    """
    แก้ไขข้อมูล user profile
    """
    try:
        # ตรวจสอบว่า user_id ตรงกับที่ส่งมาไหม
        if user_id != credentials.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID mismatch"
            )
        
        # เรียก service เพื่ออัพเดทข้อมูล
        updated_user = AuthService.update_user_profile(credentials)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user profile: {str(e)}"
        ) 