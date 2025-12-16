from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..schemas.auth_schema import (
    UserCreate,
    UserLogin,
    Token,
    UserResponse,
    MfaLoginRequest,
    MfaConfirmRequest,
)
from ..services.auth_service import (
    create_user,
    authenticate_user,
    create_access_token,
    get_current_user,
    require_admin,
    generate_mfa_secret,
    generate_mfa_qr,
    verify_mfa_token,
)
from ..models.user_model import User


router = APIRouter(tags=["Auth"])


# ============================================================
# CLINICIAN REGISTRATION
# ============================================================
@router.post("/register", response_model=UserResponse)
def register_clinician(user_in: UserCreate, db: Session = Depends(get_db)):
    user_in.role = "clinician"
    return create_user(db, user_in)


# ============================================================
# ADMIN REGISTRATION
# ============================================================
@router.post("/register-admin", response_model=UserResponse)
def register_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    user_in.role = "admin"
    return create_user(db, user_in)


# ============================================================
# LOGIN (Clinician)
# ============================================================
@router.post("/login", response_model=Token)
def login_clinician(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(401, "Invalid credentials")

    # Requires MFA
    if user.mfa_enabled:
        return {
            "access_token": None,
            "requires_mfa": True,
            "temp_token": create_access_token(user),
            "token_type": "bearer",
        }

    token = create_access_token(user)

    return {"access_token": token, "token_type": "bearer"}


# ============================================================
# LOGIN (Admin)
# ============================================================
@router.post("/login-admin", response_model=Token)
def login_admin(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(401, "Invalid credentials")

    if user.role != "admin":
        raise HTTPException(403, "Admin access required")

    if user.mfa_enabled:
        return {
            "access_token": None,
            "requires_mfa": True,
            "temp_token": create_access_token(user),
            "token_type": "bearer",
        }

    token = create_access_token(user)
    return {"access_token": token, "token_type": "bearer"}


# ============================================================
# MFA LOGIN — FIXED (uses proper schema)
# ============================================================
@router.post("/login-mfa", response_model=Token)
def login_with_mfa(payload: MfaLoginRequest, db: Session = Depends(get_db)):
    """
    MFA login flow:
    - temp_token (from login)
    - otp (from authenticator app)
    """
    # Extract user from temp token
    try:
        user = authenticate_user(db, payload.email, payload.password)
    except:
        raise HTTPException(401, "Invalid credentials")

    if not user or not user.mfa_enabled:
        raise HTTPException(400, "MFA is not enabled for this account")

    # Validate OTP
    if not verify_mfa_token(user.mfa_secret, payload.otp):
        raise HTTPException(400, "Invalid MFA code")

    # Issue final JWT
    token = create_access_token(user)

    return {"access_token": token, "token_type": "bearer"}


# ============================================================
# ENABLE MFA → Generate secret + QR code
# ============================================================
@router.post("/enable-mfa")
def enable_mfa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.mfa_enabled:
        raise HTTPException(400, "MFA already enabled")

    secret = generate_mfa_secret()
    current_user.mfa_secret = secret
    db.commit()

    qr_png = generate_mfa_qr(current_user.email, secret)

    return Response(content=qr_png, media_type="image/png")


# ============================================================
# CONFIRM MFA ENABLE
# ============================================================
@router.post("/confirm-mfa")
def confirm_mfa(
    payload: MfaConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.mfa_secret:
        raise HTTPException(400, "MFA setup has not started")

    if not verify_mfa_token(current_user.mfa_secret, payload.otp):
        raise HTTPException(400, "Invalid MFA code")

    current_user.mfa_enabled = True
    db.commit()

    return {"message": "MFA successfully enabled"}


# ============================================================
# DISABLE MFA
# ============================================================
@router.post("/disable-mfa")
def disable_mfa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    db.commit()

    return {"message": "MFA disabled"}


# ============================================================
# CURRENT USER
# ============================================================
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
