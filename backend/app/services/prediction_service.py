from typing import Dict, Any
import numpy as np
import pandas as pd

import shap

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

_SELECTED_FEATURES = list(_metrics.get("selected_features", _FEATURE_COLUMNS))

print("DEBUG _SELECTED_FEATURES:", type(_SELECTED_FEATURES), len(_SELECTED_FEATURES))

# ============================================================
# INIT SHAP EXPLAINER SAFELY (RandomForest → TreeExplainer)
# ============================================================
try:
    shap_explainer = shap.TreeExplainer(_model)
    print("SHAP TreeExplainer initialized")
except Exception as e:
    print("⚠ SHAP initialization failed:", e)
    shap_explainer = None


# ============================================================
# FEATURE ENGINEERING
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

    # ------------------------
    # 1. Convert input → DataFrame
    # ------------------------
    df = pd.DataFrame([payload.dict()])

    # 2. Feature engineering
    df = _engineer_features(df)

    # 3. Ensure expected columns exist
    for col in _FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0

    df = df[_FEATURE_COLUMNS]

    # 4. Label encode categoricals
    for col in _CATEGORICAL_COLUMNS:
        if col in df.columns and col in _label_encoders:
            le = _label_encoders[col]
            try:
                df[col] = le.transform(df[col].astype(str))
            except Exception:
                df[col] = 0  # unseen category fallback

    # 5. Scale numeric columns
    df[_NUMERIC_COLUMNS] = _scaler.transform(df[_NUMERIC_COLUMNS])

    # 6. Apply feature selection
    df = df[_SELECTED_FEATURES]
    df = df.astype(float)

    # Copy raw row for SHAP index alignment
    X_input = df.values

    # ------------------------
    # 7. Predict
    # ------------------------
    proba = _model.predict_proba(df)[0]
    pred_index = int(np.argmax(proba))

    predicted_subtype = _TARGET_NAMES[pred_index]

    probabilities = {
        str(_TARGET_NAMES[i]): float(proba[i])
        for i in range(len(proba))
    }

    # ============================================================
    # 8. SHAP COMPUTATION (SAFE)
    # ============================================================
    shap_data = None

    if shap_explainer is not None:
        try:
            shap_values = shap_explainer.shap_values(X_input)

            # SHAP always returns a list for multiclass RF
            if not isinstance(shap_values, list):
                shap_values = [shap_values]

            num_classes = len(shap_values)

            # Prevent out-of-bounds indexing
            if pred_index >= num_classes:
                print(
                    f"⚠ SHAP mismatch: model predicted class index {pred_index}, "
                    f"but SHAP returned {num_classes} class arrays."
                )
                shap_for_pred = None
            else:
                shap_for_pred = shap_values[pred_index][0]

            if shap_for_pred is not None:
                shap_data = {
                    "base_value": float(
                        shap_explainer.expected_value[pred_index]
                        if isinstance(shap_explainer.expected_value, (list, np.ndarray))
                        else shap_explainer.expected_value
                    ),
                    "feature_values": {
                        feature: float(X_input[0][i])
                        for i, feature in enumerate(_SELECTED_FEATURES)
                    },
                    "shap_values": {
                        feature: float(shap_for_pred[i])
                        for i, feature in enumerate(_SELECTED_FEATURES)
                    },
                    "ranked_importance": sorted(
                        [
                            (feature, float(abs(shap_for_pred[i])))
                            for i, feature in enumerate(_SELECTED_FEATURES)
                        ],
                        key=lambda x: x[1],
                        reverse=True,
                    ),
                }

        except Exception as e:
            print("⚠ SHAP computation failed:", e)
            shap_data = None

    # ============================================================
    # 9. RETURN CLEAN API FORMAT
    # ============================================================
    return {
        "predicted_subtype": str(predicted_subtype),
        "confidence": float(np.max(proba)),
        "probabilities": probabilities,
        "features_used": [str(f) for f in _SELECTED_FEATURES],
        "shap": shap_data,
    }
