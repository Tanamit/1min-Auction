from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    user_name: str
    user_email: EmailStr
    password: str
    address: str
    create_date: str
    first_name: str
    last_name: str
    role_id: int = 3  # Default role_id for regular users
    verify_img: Optional[str] = None
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    user_email: str
    user_name: str
    address: str
    create_date: str
    first_name: str
    last_name: str
    role_id: int  
    verify_img: Optional[str] = None
    
class LoginResponse(BaseModel):
    user: UserResponse
    token: str
    message: str
    
class EditUserProfileRequest(BaseModel):
    user_id: str
    user_email: EmailStr
    user_name: str
    verify_img:  Optional[str] = None
    address: Optional[str] = None
    create_date: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

# --- Password management request models ---
class ForgetPasswordRequest(BaseModel):
    """Request to initiate password reset - provide either user_id or email"""
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None

class ResetPasswordRequest(BaseModel):
    """Request to reset password with token"""
    token: Optional[str] = None  # Make token optional
    new_password: str
    # Optional fallback identifiers if token is not used
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None