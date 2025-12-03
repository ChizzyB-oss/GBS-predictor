from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..schemas.auth_schema import UserCreate, UserLogin, Token, UserResponse
from ..services.auth_service import (
    create_user,
    authenticate_user,
    create_user_token,
    get_current_user,
    require_admin,
)
from ..models.user_model import User

router = APIRouter(prefix="/auth", tags=["Auth"])


# ============================================================
# CLINICIAN REGISTRATION
# ============================================================
@router.post("/register", response_model=UserResponse)
def register_clinician(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a clinician (default user type).
    """
    user_in.role = "clinician"
    return create_user(db, user_in)


# ============================================================
# ADMIN REGISTRATION — ONLY EXISTING ADMIN CAN DO THIS
# ============================================================
@router.post("/register-admin", response_model=UserResponse)
def register_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Create a new admin. Requires an existing admin's token.
    """
    user_in.role = "admin"
    return create_user(db, user_in)


# ============================================================
# CLINICIAN LOGIN
# ============================================================
@router.post("/login", response_model=Token)
def login_clinician(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_user_token(user)
    return {"access_token": token, "token_type": "bearer"}


# ============================================================
# ADMIN LOGIN
# ============================================================
@router.post("/login-admin", response_model=Token)
def login_admin(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    token = create_user_token(user)
    return {"access_token": token, "token_type": "bearer"}


# ============================================================
# GET CURRENT LOGGED-IN USER
# ============================================================
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
