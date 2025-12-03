from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..services.auth_service import require_admin
from ..models.prediction_model import Prediction
from ..models.user_model import User

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    System-wide stats for the Admin Dashboard.
    Matches what the frontend expects:
      - total_users
      - total_predictions
      - predictions_today
      - server_uptime
      - subtype_distribution
    """

    # Total registered users
    total_users = db.query(User).count()

    # Total predictions in the system
    total_predictions = db.query(Prediction).count()

    # Predictions created today (all users)
    today = date.today()
    predictions_today = (
        db.query(Prediction)
        .filter(func.date(Prediction.created_at) == today)
        .count()
    )

    # Subtype distribution across all predictions
    # Returns list of (subtype, count)
    subtype_rows = (
        db.query(
            Prediction.predicted_subtype,
            func.count(Prediction.id)
        )
        .group_by(Prediction.predicted_subtype)
        .all()
    )

    subtype_distribution = {
        subtype: count for subtype, count in subtype_rows
    }

    # Simple placeholder uptime string – good enough for dashboard display
    server_uptime = "99.9%"

    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "predictions_today": predictions_today,
        "server_uptime": server_uptime,
        "subtype_distribution": subtype_distribution,
    }


@router.get("/recent-predictions")
def admin_recent_predictions(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Recent predictions across all users (for any admin views that need it).
    """
    rows = (
        db.query(Prediction)
        .order_by(Prediction.created_at.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "predicted_subtype": r.predicted_subtype,
            "confidence": r.confidence,
            "created_at": r.created_at,
        }
        for r in rows
    ]
