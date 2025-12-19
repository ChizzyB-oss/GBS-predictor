from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from io import BytesIO

import pyotp
import qrcode
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.user_model import User

# ======================================================
# JWT SETTINGS
# ======================================================

SECRET_KEY = "supersecret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# IMPORTANT: this MUST match your actual login endpoint
# Your swagger shows /api/auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ======================================================
# PASSWORD HANDLERS
# ======================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ======================================================
# JWT TOKEN CREATION + DECODE
# ======================================================

def create_access_token(user: User, mfa_pending: bool = False) -> str:
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "mfa_pending": mfa_pending,  # 🔥 key for MFA flow
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


# ======================================================
# USER LOOKUP
# ======================================================

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


# ======================================================
# REGISTER USER
# ======================================================

def create_user(db: Session, user_in):
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=hash_password(user_in.password),
        mfa_enabled=False,
        mfa_secret=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ======================================================
# BASIC LOGIN AUTH
# ======================================================

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ======================================================
# MFA UTILITIES
# ======================================================

def generate_mfa_secret() -> str:
    return pyotp.random_base32()


def generate_mfa_qr(email: str, secret: str) -> bytes:
    uri = pyotp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name="GBS Decision Support System",
    )

    qr = qrcode.QRCode(box_size=8, border=4)
    qr.add_data(uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def verify_mfa_token(secret: str, token: str) -> bool:
    if not secret:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)


# ======================================================
# CURRENT USER (BLOCKS MFA-PENDING TOKENS)
# ======================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = decode_token(token)

    user_id = payload.get("sub")
    mfa_pending = payload.get("mfa_pending", False)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 🔥 critical: temp tokens cannot access protected endpoints
    if mfa_pending:
        raise HTTPException(status_code=401, detail="MFA verification required")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ======================================================
# REQUIRE ADMIN
# ======================================================

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
