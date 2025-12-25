from typing import Optional
from pydantic import BaseModel, EmailStr


# ============================
# BASE USER
# ============================

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


# ============================
# USER CREATION
# ============================

class UserCreate(UserBase):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "clinician"


# ============================
# LOGIN PAYLOAD
# ============================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============================
# USER RESPONSE
# ============================

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True   # ✅ Pydantic v2 fix


# ============================
# BASIC TOKEN (legacy)
# ============================

class Token(BaseModel):
    access_token: str
    token_type: str


# ============================
# MFA PAYLOADS
# ============================

class MfaConfirmRequest(BaseModel):
    otp: str


class MFAVerifyRequest(BaseModel):
    otp: str
    temp_token: str


# ============================
# LOGIN RESPONSE (MFA AWARE)
# ============================

class LoginResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    mfa_required: bool = False
    temp_token: Optional[str] = None
    role: Optional[str] = None
