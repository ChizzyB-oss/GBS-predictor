from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.auth_service import require_admin
from ..models.user_model import User

router = APIRouter(
    tags=["Admin Users"],
)


@router.get("/")
def get_all_users(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    users = db.query(User).all()
    return users


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
