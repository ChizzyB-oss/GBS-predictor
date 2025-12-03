import json
import os
from typing import Dict

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler


DATA_PATH = "data/synthetic_gbs_dataset.csv"
MODELS_DIR = "models"


BASE_FEATURES = [
    "age",
    "gender",
    "previous_infection",
    "onset_speed",
    "muscle_weakness",
    "paralysis",
    "sensory_loss",
    "reflex_loss",
    "respiratory_involvement",
    "cranial_nerve_involvement",
    "motor_velocity",
    "sensory_velocity",
    "amplitude",
    "f_wave_latency",
    "conduction_block",
    "csf_protein",
]

ENGINEERED_FEATURES = [
    "age_group",
    "symptom_severity",
    "velocity_ratio",
    "csf_category",
]

CATEGORICAL_COLUMNS = [
    "gender",
    "previous_infection",
    "onset_speed",
    "age_group",
    "csf_category",
]

TARGET_COLUMN = "gbs_subtype"


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Age group
    df["age_group"] = pd.cut(
        df["age"],
        bins=[0, 18, 40, 60, 150],
        labels=["child", "young_adult", "adult", "senior"],
        include_lowest=True,
    ).astype(str)

    # Symptom severity (sum of key binary symptoms)
    severity_cols = [
        "muscle_weakness",
        "paralysis",
        "sensory_loss",
        "respiratory_involvement",
        "cranial_nerve_involvement",
    ]
    df["symptom_severity"] = df[severity_cols].sum(axis=1)

    # Velocity ratio
    df["velocity_ratio"] = (
        df["motor_velocity"] / df["sensory_velocity"]
    ).replace([np.inf, -np.inf], 0).fillna(0)

    # CSF protein category
    df["csf_category"] = pd.cut(
        df["csf_protein"],
        bins=[0, 45, 90, 200],
        labels=["normal", "elevated", "high"],
        include_lowest=True,
    ).astype(str)

    return df


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    # 1. Load dataset
    df = pd.read_csv(DATA_PATH)

    missing = [col for col in BASE_FEATURES + [TARGET_COLUMN] if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in dataset: {missing}")

    # 2. Base features + target
    X = df[BASE_FEATURES].copy()
    y = df[TARGET_COLUMN].copy()

    # 3. Feature engineering
    X = engineer_features(X)

    # 4. Encode categoricals
    label_encoders: Dict[str, LabelEncoder] = {}
    for col in CATEGORICAL_COLUMNS:
        if col not in X.columns:
            raise ValueError(f"Expected categorical column '{col}' not found in features.")
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le

    # 5. Encode target
    target_encoder = LabelEncoder()
    y_encoded = target_encoder.fit_transform(y)
    target_names = list(target_encoder.classes_)

    # 6. Identify numerical columns (after encoding)
    numerical_columns = X.select_dtypes(include=[np.number]).columns.tolist()
    feature_columns = X.columns.tolist()

    # 7. Scale numerical columns
    scaler = StandardScaler()
    X_scaled = X.copy()
    X_scaled[numerical_columns] = scaler.fit_transform(X[numerical_columns])

    # 8. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    # 9. Train a Random Forest (simple but strong)
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
    )
    model.fit(X_train, y_train)

    # 10. Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    print("\n=== Evaluation on Test Set ===")
    print(f"Accuracy: {acc:.3f}")
    print(f"F1-score (weighted): {f1:.3f}")
    print("\nClassification report:")
    print(classification_report(y_test, y_pred, target_names=target_names))

    # 11. Save artifacts
    joblib.dump(model, os.path.join(MODELS_DIR, "best_gbs_model.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.pkl"))
    joblib.dump(label_encoders, os.path.join(MODELS_DIR, "label_encoders.pkl"))
    joblib.dump(target_encoder, os.path.join(MODELS_DIR, "target_encoder.pkl"))

    # 12. Save preprocessing info
    preprocessing_info = {
        "feature_columns": feature_columns,
        "numerical_columns": numerical_columns,
        "categorical_columns": CATEGORICAL_COLUMNS,
        "target_name": TARGET_COLUMN,
        "target_names": target_names,
        "base_features": BASE_FEATURES,
        "engineered_features": ENGINEERED_FEATURES,
    }
    with open(os.path.join(MODELS_DIR, "preprocessing_info.json"), "w") as f:
        json.dump(preprocessing_info, f, indent=2)

    # 13. Save metrics (optional)
    metrics = {
        "accuracy": acc,
        "f1_weighted": f1,
        "target_names": target_names,
    }
    with open(os.path.join(MODELS_DIR, "model_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n✅ Retraining complete. Artifacts saved in 'models/'")


if __name__ == "__main__":
    main()
