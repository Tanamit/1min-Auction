from pydantic import BaseModel, field_validator, ValidationInfo

class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info: ValidationInfo):
        # info.data contains already-parsed fields
        new_pw = (info.data or {}).get("new_password")
        if new_pw is not None and v != new_pw:
            raise ValueError("New password and confirm password do not match")
        return v
