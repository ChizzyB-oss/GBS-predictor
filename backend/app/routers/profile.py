from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.auth_service import get_current_user
from ..models.user_model import User

router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)

@router.get("/")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "hospital": current_user.hospital,
        "specialty": current_user.specialty,
        "role": current_user.role
    }

@router.put("/")
def update_profile(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    allowed_fields = ["full_name", "hospital", "specialty"]

    for key, value in payload.items():
        if key in allowed_fields:
            setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user
