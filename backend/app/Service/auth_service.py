import os
from supabase import create_client, Client
import json
import secrets
from typing import Optional, Dict
from app.Model.User import UserLogin, UserResponse, EditUserProfileRequest
from fastapi import HTTPException, status 
import hashlib

# อ่าน config
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # app/Service/..
print("BASE_DIR =", BASE_DIR)
CONFIG_PATH = os.path.join(BASE_DIR, "Config.json")

with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)

supabase: Client = create_client(config['SUPABASE_URL'], config['SUPABASE_KEY'])

class AuthService:

    @staticmethod
    def hash_password(password: str) -> str:
        # MD5 hash
        return hashlib.md5(password.encode('utf-8')).hexdigest()
    
    @staticmethod
    async def login_user(email: str, password: str) -> Optional[Dict]:
        """
        ตรวจสอบ login และดึงข้อมูล user
        
        Args:
            email: อีเมลของ user
            password: รหัสผ่าน (plain text)
            
        Returns:
            Dict ของข้อมูล user ถ้า login สำเร็จ, None ถ้าไม่สำเร็จ
        """
        try:
            # Query user จาก Supabase (ไม่ hash password)
            hashed_password = AuthService.hash_password(password)
            response = supabase.table('users').select('*').eq('user_email', email).eq('password', hashed_password).execute()
            
            # ตรวจสอบว่ามีข้อมูลหรือไม่
            if not response.data or len(response.data) == 0:
                return None
            
            user = response.data[0]
            return user
            
        except Exception as e:
            print(f"Login error: {e}")
            raise e
    
    @staticmethod
    def generate_token(user_id: str) -> str:
        """
        สร้าง token สำหรับ session
        
        Args:
            user_id: ID ของ user
            
        Returns:
            Token string
        """
        # สร้าง random token
        return secrets.token_urlsafe(32)
    @staticmethod
    def update_user_profile(user_data: EditUserProfileRequest) -> UserResponse:
        """
        อัพเดทข้อมูล user profile ใน Supabase
        """
        try:
            # สร้าง dictionary สำหรับข้อมูลที่จะอัพเดท
            update_data = {
                "user_email": user_data.user_email,
                "user_name": user_data.user_name,
            }
            
            # เพิ่มข้อมูล optional fields ถ้ามี
            if user_data.first_name is not None:
                update_data["first_name"] = user_data.first_name
            
            if user_data.last_name is not None:
                update_data["last_name"] = user_data.last_name
            
            if user_data.address is not None:
                update_data["address"] = user_data.address

            if user_data.create_date is not None:
                update_data["created_at"] = user_data.create_date
            
            # อัพเดทข้อมูลใน Supabase
            response = supabase.table("users").update(update_data).eq("user_id", user_data.user_id).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            user = response.data[0]
            
            # Return UserResponse
            return UserResponse(
                user_id=user["user_id"],
                user_email=user["user_email"],
                user_name=user["user_name"],
                address=user.get("address", ""),
                create_date=user.get("created_at", ""),
                first_name=user.get("first_name", ""),
                last_name=user.get("last_name", ""),
                role_id=user["role_id"],
                verify_img=user.get("verify_img", "")
            )
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error in update_user_profile: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )