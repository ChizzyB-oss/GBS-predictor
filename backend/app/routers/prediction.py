from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
import json
from datetime import datetime
from typing import Any, Dict

from ..schemas.prediction_schema import GBSPredictionInput
from ..services.prediction_service import predict_subtype
from ..services.auth_service import get_current_user
from ..core.database import get_db
from ..models.prediction_model import Prediction

# NEW — PDF generator
from ..services.report_service import generate_prediction_pdf


router = APIRouter(tags=["Prediction"])


# =====================================================================
# 🔵 RUN A NEW PREDICTION
# =====================================================================
@router.post("/predict")
def predict_gbs_subtype(
    payload: GBSPredictionInput,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Run prediction, save it, and return JSON-safe response."""
    try:
        # ---------------------------------------------------------
        # 1) Pydantic v1/v2 compatible extraction
        # ---------------------------------------------------------
        if hasattr(payload, "model_dump"): 
            payload_data = payload.model_dump()
        else:                               
            payload_data = payload.dict()

        # ---------------------------------------------------------
        # 2) Perform prediction (returns clean Python data)
        # ---------------------------------------------------------
        result: Dict[str, Any] = predict_subtype(payload)

        predicted_subtype = str(result.get("predicted_subtype"))
        confidence = float(result.get("confidence", 0.0))
        probabilities = result.get("probabilities", {})
        features_used = result.get("features_used", [])
        shap = result.get("shap")  # could be None

        # ---------------------------------------------------------
        # 3) Persist prediction record
        # ---------------------------------------------------------
        pred_row = Prediction(
            user_id=current_user.id,
            input_data=json.dumps(payload_data),
            predicted_subtype=predicted_subtype,
            confidence=confidence,
            probabilities=json.dumps(probabilities),
            created_at=datetime.utcnow(),
        )

        db.add(pred_row)
        db.commit()
        db.refresh(pred_row)

        # ---------------------------------------------------------
        # 4) Respond to frontend
        # ---------------------------------------------------------
        return {
            "predicted_subtype": predicted_subtype,
            "confidence": confidence,
            "probabilities": probabilities,
            "features_used": features_used,
            "shap": shap,
            "id": pred_row.id,
            "created_at": (
                pred_row.created_at.isoformat()
                if pred_row.created_at else None
            ),
        }

    except Exception as e:
        print("❌ Prediction endpoint failed:", repr(e))
        raise HTTPException(500, f"Prediction failed: {str(e)}")



# =====================================================================
# 🔵 GENERATE & DOWNLOAD A PDF REPORT
# =====================================================================
@router.get("/{prediction_id}/report")
def download_prediction_report(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Generate a PDF report for a saved prediction."""

    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(404, "Prediction not found")

    # Only allow owner or admin to download
    if current_user.role != "admin" and pred.user_id != current_user.id:
        raise HTTPException(403, "Not allowed to access this report")

    # Rebuild dictionary for PDF generator
    pred_dict = {
        "predicted_subtype": pred.predicted_subtype,
        "confidence": pred.confidence,
        "probabilities": json.loads(pred.probabilities),
    }

    # SHAP not persisted yet, set None
    shap_data = None

    try:
        pdf_bytes = generate_prediction_pdf(pred_dict, shap_data)
    except Exception as e:
        print("❌ PDF generation failed:", repr(e))
        raise HTTPException(500, f"PDF generation failed: {str(e)}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=prediction_{prediction_id}.pdf"
        }
    )
