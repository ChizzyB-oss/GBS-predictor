from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..schemas.auth_schema import (
    UserCreate,
    UserLogin,
    UserResponse,
    LoginResponse,
    MFAVerifyRequest,
    MfaConfirmRequest,
)
from ..services.auth_service import (
    create_user,
    authenticate_user,
    create_access_token,
    decode_token,
    get_current_user,
    require_admin,
    generate_mfa_secret,
    generate_mfa_qr,
    verify_mfa_token,
)
from ..models.user_model import User

router = APIRouter(tags=["Auth"])


# ============================================================
# REGISTER CLINICIAN
# ============================================================
@router.post("/register", response_model=UserResponse)
def register_clinician(user_in: UserCreate, db: Session = Depends(get_db)):
    user_in.role = "clinician"
    return create_user(db, user_in)


# ============================================================
# REGISTER ADMIN (ADMIN ONLY)
# ============================================================
@router.post("/register-admin", response_model=UserResponse)
def register_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user_in.role = "admin"
    return create_user(db, user_in)


# ============================================================
# LOGIN — CLINICIAN
# ============================================================
@router.post("/login", response_model=LoginResponse)
def login_clinician(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # MFA enabled → return temp_token (mfa_pending=True)
    if user.mfa_enabled:
        temp_token = create_access_token(user, mfa_pending=True)
        return LoginResponse(mfa_required=True, temp_token=temp_token, role=user.role)

    token = create_access_token(user, mfa_pending=False)
    return LoginResponse(access_token=token, token_type="bearer", mfa_required=False, role=user.role)


# ============================================================
# LOGIN — ADMIN
# ============================================================
@router.post("/login-admin", response_model=LoginResponse)
def login_admin(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    if user.mfa_enabled:
      temp_token = create_access_token(user, mfa_pending=True)
      return LoginResponse(
        mfa_required=True,
        temp_token=temp_token,
        role=user.role
    )


    token = create_access_token(user, mfa_pending=False)
    return LoginResponse(access_token=token, token_type="bearer", mfa_required=False, role=user.role)


# ============================================================
# VERIFY MFA — ISSUE FINAL TOKEN
# ============================================================
@router.post("/verify-mfa", response_model=LoginResponse)
def verify_mfa_login(payload: MFAVerifyRequest, db: Session = Depends(get_db)):
    # Decode temp token
    temp_payload = decode_token(payload.temp_token)

    if temp_payload.get("mfa_pending") is not True:
        raise HTTPException(status_code=400, detail="Invalid MFA session")

    user_id = temp_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid MFA session")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA not enabled for this account")

    if not verify_mfa_token(user.mfa_secret, payload.otp):
        raise HTTPException(status_code=400, detail="Invalid MFA code")

    token = create_access_token(user, mfa_pending=False)
    return LoginResponse(access_token=token, token_type="bearer", mfa_required=False, role=user.role)


# ============================================================
# ENABLE MFA — RETURN QR PNG
# ============================================================
@router.post("/enable-mfa")
def enable_mfa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA already enabled")

    secret = generate_mfa_secret()
    current_user.mfa_secret = secret
    db.commit()

    qr_png = generate_mfa_qr(current_user.email, secret)
    return Response(content=qr_png, media_type="image/png")


# ============================================================
# CONFIRM MFA — JSON BODY
# ============================================================
@router.post("/confirm-mfa")
def confirm_mfa(
    payload: MfaConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated")

    if not verify_mfa_token(current_user.mfa_secret, payload.otp):
        raise HTTPException(status_code=400, detail="Invalid MFA code")

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
