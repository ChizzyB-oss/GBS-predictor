from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..services.auth_service import get_current_user
from ..models.user_model import User
from ..models.prediction_model import Prediction
from ..models.review_request_model import ReviewRequest
from ..schemas.review_schema import ReviewRequestCreate, ReviewRequestOut, ReviewStatusUpdate

router = APIRouter(prefix="/reviews", tags=["Peer Review"])

# ---------------------------------------------------------
# 1) List colleagues (clinicians) you can send to
# ---------------------------------------------------------
@router.get("/colleagues")
def list_colleagues(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Return other clinicians only (adjust if you want admins too)
    qs = (
        db.query(User)
        .filter(User.role == "clinician")
        .filter(User.is_active == True)
        .filter(User.id != current_user.id)
        .order_by(User.full_name.asc())
        .all()
    )
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "hospital": getattr(u, "hospital", None),
            "specialty": getattr(u, "specialty", None),
        }
        for u in qs
    ]

# ---------------------------------------------------------
# 2) Create a review request
# ---------------------------------------------------------
@router.post("/request")
def create_review_request(
    payload: ReviewRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ensure prediction exists and belongs to sender (owner) OR sender is admin
    pred = db.query(Prediction).filter(Prediction.id == payload.prediction_id).first()
    if not pred:
        raise HTTPException(404, "Prediction not found")

    if current_user.role != "admin" and pred.user_id != current_user.id:
        raise HTTPException(403, "Not allowed to share a prediction you do not own")

    # Ensure recipient exists and is a clinician
    recipient = db.query(User).filter(User.id == payload.recipient_id).first()
    if not recipient or not recipient.is_active:
        raise HTTPException(404, "Recipient not found")

    if recipient.role != "clinician" and current_user.role != "admin":
        raise HTTPException(400, "Recipient must be a clinician")

    rr = ReviewRequest(
        sender_id=current_user.id,
        recipient_id=payload.recipient_id,
        prediction_id=payload.prediction_id,
        note=payload.note,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(rr)
    db.commit()
    db.refresh(rr)

    return {"message": "Review request sent", "id": rr.id}

# ---------------------------------------------------------
# 3) Inbox: review requests sent TO you
# ---------------------------------------------------------
@router.get("/inbox", response_model=List[ReviewRequestOut])
def inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(ReviewRequest, User, Prediction)
        .join(User, User.id == ReviewRequest.sender_id)
        .join(Prediction, Prediction.id == ReviewRequest.prediction_id)
        .filter(ReviewRequest.recipient_id == current_user.id)
        .order_by(ReviewRequest.created_at.desc())
        .all()
    )

    out = []
    for rr, sender, pred in rows:
        out.append(
            ReviewRequestOut(
                id=rr.id,
                sender_id=rr.sender_id,
                recipient_id=rr.recipient_id,
                prediction_id=rr.prediction_id,
                note=rr.note,
                status=rr.status,
                created_at=rr.created_at,
                sender_name=sender.full_name,
                sender_email=sender.email,
                predicted_subtype=pred.predicted_subtype,
                confidence=pred.confidence,
            )
        )
    return out

# ---------------------------------------------------------
# 4) Update status (viewed/resolved)
# ---------------------------------------------------------
@router.patch("/{review_id}/status")
def update_status(
    review_id: int,
    payload: ReviewStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed = {"pending", "viewed", "resolved"}
    if payload.status not in allowed:
        raise HTTPException(400, f"status must be one of {allowed}")

    rr = db.query(ReviewRequest).filter(ReviewRequest.id == review_id).first()
    if not rr:
        raise HTTPException(404, "Review request not found")

    # Only recipient (or admin) can update status
    if current_user.role != "admin" and rr.recipient_id != current_user.id:
        raise HTTPException(403, "Not allowed")

    rr.status = payload.status
    db.commit()
    return {"message": "Status updated"}
