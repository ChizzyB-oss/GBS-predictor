from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random

from ..services.auth_service import get_current_admin
from ..core.database import get_db
from ..models.user_model import User
from ..models.prediction_model import Prediction

router = APIRouter(prefix="/api/admin/monitoring", tags=["Admin Monitoring"])


# -------------------------------------------------------------
# 1. SUMMARY METRICS
# -------------------------------------------------------------
@router.get("/summary")
def get_monitoring_summary(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)  # ensures only admins can see this
):
    total_users = db.query(User).count()
    total_predictions = db.query(Prediction).count()

    # Fake uptime + latency — later you can replace with real metrics
    uptime_hours = random.randint(10, 72)
    avg_latency = random.randint(90, 180)
    p95_latency = avg_latency + random.randint(40, 90)
    error_rate = round(random.uniform(0.1, 1.5), 2)

    return {
        "status": "Online",
        "uptime": f"{uptime_hours}h {random.randint(1,59)}m",
        "apiLatencyAvg": avg_latency,
        "apiLatencyP95": p95_latency,
        "errorRate": error_rate,
        "requestsLastHour": random.randint(100, 250),
        "dbStatus": "Healthy",
        "dbSizeMb": random.randint(80, 180),
        "dbUsersCount": total_users,
        "dbPredictionsCount": total_predictions,
        "modelVersion": "v1.0.0",
        "modelDeployedAt": "2025-11-01T10:00:00Z",
    }


# -------------------------------------------------------------
# 2. LATENCY SERIES (LINE CHART)
# -------------------------------------------------------------
@router.get("/latency-series")
def get_latency_series(
    admin=Depends(get_current_admin)
):
    now = datetime.utcnow()
    data = []

    for i in range(6):  # last 1 hour (10 min intervals)
        timestamp = (now - timedelta(minutes=10 * (5 - i))).strftime("%H:%M")
        data.append({
            "time": timestamp,
            "latency": random.randint(90, 220)
        })

    return data


# -------------------------------------------------------------
# 3. REQUEST COUNT SERIES (BAR CHART)
# -------------------------------------------------------------
@router.get("/request-series")
def get_request_series(
    admin=Depends(get_current_admin)
):
    now = datetime.utcnow()
    data = []

    for i in range(6):
        timestamp = (now - timedelta(minutes=10 * (5 - i))).strftime("%H:%M")
        data.append({
            "time": timestamp,
            "count": random.randint(5, 20)
        })

    return data


# -------------------------------------------------------------
# 4. RECENT EVENTS LOG
# -------------------------------------------------------------
@router.get("/events")
def get_recent_events(
    admin=Depends(get_current_admin)
):
    events = [
        {
            "type": "prediction",
            "message": "Prediction created by clinician #14 (AIDP, 92.4%).",
            "time": "10:02",
        },
        {
            "type": "system",
            "message": "Nightly database backup completed successfully.",
            "time": "02:10",
        },
        {
            "type": "warning",
            "message": "Latency spike detected (p95 = 260ms).",
            "time": "09:42",
        },
    ]

    return events
