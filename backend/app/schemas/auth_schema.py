from typing import Optional
from pydantic import BaseModel, EmailStr


# Base user attributes
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


# Used when registering a new user (normal or admin)
class UserCreate(UserBase):
    password: str
    role: str = "user"      # <- Default "user", overridden for admin registration


# Used when logging in
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Response model for user info
class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        orm_mode = True


# JWT Token response
class Token(BaseModel):
    access_token: str
    token_type: str
