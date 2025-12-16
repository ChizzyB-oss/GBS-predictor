from datetime import datetime, timedelta
from typing import Optional
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

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/auth/login")


# ======================================================
# PASSWORD HANDLERS
# ======================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ======================================================
# JWT TOKEN CREATION
# ======================================================

def create_access_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ======================================================
# USER LOOKUP
# ======================================================

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


# ======================================================
# REGISTER USER
# ======================================================

def create_user(db: Session, user_in):
    # Prevent duplicate email
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user_in.password)

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=hashed_pw,
        mfa_enabled=False,
        mfa_secret=None,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ======================================================
# BASIC LOGIN AUTH (no MFA)
# ======================================================

def authenticate_user(db: Session, email: str, password: str):
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
    """Generate a new TOTP secret."""
    return pyotp.random_base32()


def generate_mfa_qr(email: str, secret: str) -> bytes:
    """Generate QR code PNG for authenticator apps."""
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
    """Verify a 6-digit TOTP code."""
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)  # allow slight clock drift


# ======================================================
# CURRENT USER CHECK
# ======================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise error
    except JWTError:
        raise error

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise error

    return user


# ======================================================
# REQUIRE ADMIN ROLE
# ======================================================

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
