from typing import Dict, Any
import numpy as np
import pandas as pd

from ..core.model_loader import load_preprocessing_and_model
from ..schemas.prediction_schema import GBSPredictionInput


# ============================================================
# LOAD ARTIFACTS
# ============================================================
_artifacts = load_preprocessing_and_model()
_model = _artifacts["model"]
_scaler = _artifacts["scaler"]
_label_encoders: Dict[str, Any] = _artifacts["label_encoders"]
_preproc_info = _artifacts["preprocessing_info"]
_metrics = _artifacts.get("metrics", {})

_FEATURE_COLUMNS = _preproc_info["feature_columns"]
_NUMERIC_COLUMNS = _preproc_info["numerical_columns"]
_CATEGORICAL_COLUMNS = _preproc_info["categorical_columns"]
_TARGET_NAMES = _preproc_info.get("target_names", [])

# 🔥 FIX — fallback to all features if selected_features is missing
_SELECTED_FEATURES = list(_metrics.get("selected_features", _FEATURE_COLUMNS))

print("DEBUG _SELECTED_FEATURES:", type(_SELECTED_FEATURES), len(_SELECTED_FEATURES))


# ============================================================
# FEATURE ENGINEERING (MATCH TRAINING EXACTLY)
# ============================================================
def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["age_group"] = pd.cut(
        df["age"],
        bins=[0, 18, 40, 60, 150],
        labels=["child", "young_adult", "adult", "senior"],
        include_lowest=True,
    ).astype(str)

    severity_cols = [
        "muscle_weakness",
        "paralysis",
        "sensory_loss",
        "respiratory_involvement",
        "cranial_nerve_involvement",
    ]
    df["symptom_severity"] = df[severity_cols].sum(axis=1)

    df["velocity_ratio"] = (
        df["motor_velocity"] / df["sensory_velocity"]
    ).replace([np.inf, -np.inf], 0).fillna(0)

    df["csf_category"] = pd.cut(
        df["csf_protein"],
        bins=[0, 45, 90, 200],
        labels=["normal", "elevated", "high"],
        include_lowest=True,
    ).astype(str)

    return df


# ============================================================
# MAIN PREDICTION FUNCTION
# ============================================================
def predict_subtype(payload: GBSPredictionInput) -> Dict[str, Any]:
    df = pd.DataFrame([payload.dict()])

    # 1. Feature engineering
    df = _engineer_features(df)

    # 2. Ensure all columns exist
    for col in _FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0

    df = df[_FEATURE_COLUMNS]

    # 3. Encode categoricals
    for col in _CATEGORICAL_COLUMNS:
        if col in df.columns and col in _label_encoders:
            le = _label_encoders[col]
            try:
                df[col] = le.transform(df[col].astype(str))
            except:
                df[col] = 0  # unseen → fallback

    # 4. Scale numericals
    df[_NUMERIC_COLUMNS] = _scaler.transform(df[_NUMERIC_COLUMNS])

    # 5. Feature selection (fallback already handled)
    df = df[_SELECTED_FEATURES]

    df = df.astype(float)  # 🔥 required for FastAPI/Pydantic

    # 6. Predict
    proba = _model.predict_proba(df)[0]
    pred_index = int(np.argmax(proba))

    predicted_subtype = _TARGET_NAMES[pred_index]

    # Convert probabilities to pure Python types
    probabilities = {
        str(_TARGET_NAMES[i]): float(proba[i])
        for i in range(len(proba))
    }

    # ============================================================
    # RETURN SAFE PYTHON TYPES ONLY (Fixes Pydantic crash)
    # ============================================================
    return {
        "predicted_subtype": str(predicted_subtype),
        "confidence": float(np.max(proba)),
        "probabilities": probabilities,
        "features_used": [str(f) for f in _SELECTED_FEATURES],
    }
