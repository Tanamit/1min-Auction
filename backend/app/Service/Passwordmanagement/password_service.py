import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, status
from app.Service.db_connection import get_supabase_client


def _hash_md5(password: str) -> str:
    """Hash password using MD5 (matching existing user creation logic)"""
    return hashlib.md5(password.encode('utf-8')).hexdigest()


class PasswordService:
    """Service for handling password reset functionality"""
    

    
    @staticmethod
    def reset_password(
        new_password: str, 
        user_id: Optional[str] = None, 
        email: Optional[str] = None,
        token: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Reset user password using email or user_id (no token required).
        
        Args:
            new_password: New password to set
            user_id: User ID (optional)
            email: User email (optional)
            token: Reset token (ignored for simplified version)
            
        Returns:
            Dictionary with user_id
            
        Raises:
            HTTPException: If user not found or database error
        """
        supabase = get_supabase_client()
        
        # Find user by user_id or email (ignore token)
        try:
            query = supabase.table('users').select('*')
            
            if user_id:
                response = query.eq('user_id', user_id).execute()
            elif email:
                response = query.eq('user_email', email).execute()
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Provide user_id or email"
                )
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail="User not found"
                )
            
            user = response.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error finding user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Database error: {e}"
            )
        
        # Hash the new password
        hashed_password = _hash_md5(new_password)
        
        # Update password only (no token fields)
        try:
            supabase.table('users').update({
                'password': hashed_password
            }).eq('user_id', user['user_id']).execute()
            
            return {'user_id': user['user_id']}
            
        except Exception as e:
            print(f"Error updating password: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Failed to update password: {e}"
            )
