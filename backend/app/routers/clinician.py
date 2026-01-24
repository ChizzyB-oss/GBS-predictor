from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..core.database import get_db
from ..services.auth_service import get_current_user
from ..models.prediction_model import Prediction
from ..models.user_model import User
from datetime import datetime

router = APIRouter(
    prefix="/clinician",
    tags=["Clinician Dashboard"],
)


@router.get("/stats")
def get_clinician_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # -----------------------------
    # 1) TOTAL PREDICTIONS
    # -----------------------------
    total_preds = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .count()
    )

    # -----------------------------
    # 2) PREDICTIONS TODAY
    # -----------------------------
    today = datetime.utcnow().date()
    preds_today = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .filter(func.date(Prediction.created_at) == today)
        .count()
    )

    # -----------------------------
    # 3) RECENT 5 PREDICTIONS
    # -----------------------------
    latest = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(5)
        .all()
    )

    recent_preds = [
        {
            "id": r.id,
            "subtype": r.predicted_subtype,
            "confidence": r.confidence,
            "created_at": r.created_at,
        }
        for r in latest
    ]

    # -----------------------------
    # 4) SUBTYPE DISTRIBUTION
    # -----------------------------
    rows = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .all()
    )

    subtype_counts = {}
    subtype_conf_sum = {}
    for r in rows:
        st = r.predicted_subtype or "Unknown"
        subtype_counts[st] = subtype_counts.get(st, 0) + 1

        conf = float(r.confidence or 0.0)
        subtype_conf_sum[st] = subtype_conf_sum.get(st, 0.0) + conf

    avg_conf_by_subtype = {
        st: (subtype_conf_sum[st] / subtype_counts[st])
        for st in subtype_counts
    }

    # -----------------------------
    # 5) MOST COMMON SUBTYPE
    # -----------------------------
    if subtype_counts:
        most_common = max(subtype_counts, key=subtype_counts.get)
    else:
        most_common = None

    # -----------------------------
    # 6) AVERAGE CONFIDENCE
    # -----------------------------
    if rows:
        avg_conf = sum([r.confidence for r in rows]) / len(rows)
    else:
        avg_conf = 0.0

    # -----------------------------
    # 7) PREDICTIONS OVER TIME (DATE → COUNT)
    # -----------------------------
    preds_over_time = (
        db.query(func.date(Prediction.created_at), func.count())
        .filter(Prediction.user_id == current_user.id)
        .group_by(func.date(Prediction.created_at))
        .order_by(func.date(Prediction.created_at))
        .all()
    )

    preds_time_dict = {
        str(date): count
        for date, count in preds_over_time
    }

    # -----------------------------
    # RETURN FULL RESPONSE
    # -----------------------------
    return {
        "total_predictions": total_preds,
        "predictions_today": preds_today,
        "most_common_subtype": most_common,
        "avg_confidence": avg_conf,  # decimal, frontend multiplies by 100
        "subtype_distribution": subtype_counts,
        "avg_confidence_by_subtype": avg_conf_by_subtype,
        "predictions_over_time": preds_time_dict,
        "recent_predictions": recent_preds,
    }
