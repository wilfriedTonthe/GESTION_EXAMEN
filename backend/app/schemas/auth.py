from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    is_teacher: bool = False

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_teacher: bool = False

class UserCreate(UserBase):
    password: str
    is_teacher: bool = False

class UserInDB(UserBase):
    id: int
    hashed_password: str
    is_active: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_teacher: bool
    is_active: bool

    class Config:
        from_attributes = True
