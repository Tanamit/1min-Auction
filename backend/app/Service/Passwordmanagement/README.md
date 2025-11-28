# Password Management API (No Token System)

ระบบจัดการรหัสผ่านสำหรับ AuctionHub แบบง่าย โดยไม่ใช้ token system

## 1. Forget Password API
**Endpoint**: `POST /api/users/password/forgot`

### Request Body:
```json
{
  "email": "user@example.com"
}
```

### Response:
```json
{
  "message": "User found. You can proceed to reset your password.",
  "user_id": "user-id-here"
}
```

**หน้าที่**: ตรวจสอบว่ามี user ที่ใช้ email นี้อยู่ในระบบหรือไม่

## 2. Reset Password API
**Endpoint**: `POST /api/users/password/reset`

### Request Body:
```json
{
  "email": "user@example.com",
  "new_password": "new-secure-password"
}
```

### Response:
```json
{
  "message": "Password updated successfully",
  "user_id": "user-id-here"
}
```

## Database Schema Requirements

ใช้ตาราง `users` ที่มีอยู่แล้ว ไม่ต้องเพิ่ม columns ใดๆ:
- `user_id` (Primary Key)
- `user_email` 
- `password`

## Security Features

1. **Email Validation**: ตรวจสอบว่า email มีอยู่ในระบบจริง
2. **MD5 Hashing**: Password ถูก hash ด้วย MD5 (ตรงกับระบบเดิม)
3. **Input Validation**: ตรวจสอบ input ทั้งหมดด้วย Pydantic models

## การใช้งาน

### Workflow:
1. User กรอก email ในหน้า Forget Password
2. ระบบตรวจสอบว่ามี user นี้หรือไม่
3. หากมี จะไปหน้า Reset Password
4. User กรอก email และ password ใหม่
5. ระบบอัปเดต password ทันที

## Files Structure

- `backend/app/Controller/Passwordmanagement/ForgetPasswordController.py` - Forget password endpoint
- `backend/app/Controller/Passwordmanagement/ResetPasswordController.py` - Reset password endpoint  
- `backend/app/Service/Passwordmanagement/password_service.py` - Business logic
- `backend/app/Model/User.py` - Request/Response models

## Frontend Flow

1. **ForgetPassword.jsx**: รับ email และตรวจสอบ user
2. **ResetPassword.jsx**: รับ email + password ใหม่และอัปเดต

## Testing

### Manual Testing:
1. เรียก `/forgot` endpoint พร้อม email ของผู้ใช้
2. หากพบ user จะได้ response สำเร็จ
3. เรียก `/reset` endpoint พร้อม email และรหัสผ่านใหม่
4. ทดสอบ login ด้วยรหัสผ่านใหม่

## Error Handling

- **400 Bad Request**: Missing required fields
- **404 Not Found**: User not found
- **500 Internal Server Error**: Database errors
