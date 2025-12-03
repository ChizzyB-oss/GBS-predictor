import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import json


class GBSPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.target_encoder = LabelEncoder()
        self.numerical_columns = None
        self.categorical_columns = None
        self.feature_columns = None
        self.target_name = "gbs_subtype"

    def load_data(self):
        """Load the original clinical dataset."""
        self.data = pd.read_csv('data/synthetic_gbs_dataset.csv')
        print(f"✓ Loaded dataset with {len(self.data)} samples")
        return self.data

    def engineer_features(self, data):
        """Create clinically meaningful engineered features."""
        df = data.copy()

        # Age groups
        df['age_group'] = pd.cut(
            df['age'],
            bins=[0, 18, 40, 60, 100],
            labels=['child', 'young_adult', 'adult', 'senior']
        )

        # Symptom severity (sum of binary symptom flags)
        symptom_cols = [
            'muscle_weakness',
            'paralysis',
            'sensory_loss',
            'respiratory_involvement',
            'cranial_nerve_involvement'
        ]
        df['symptom_severity'] = df[symptom_cols].sum(axis=1)

        # Electrophysiological ratio
        df['velocity_ratio'] = df['motor_velocity'] / df['sensory_velocity']
        df['velocity_ratio'] = df['velocity_ratio'].replace(
            [np.inf, -np.inf],
            np.nan
        ).fillna(0)

        # CSF protein categories
        df['csf_category'] = pd.cut(
            df['csf_protein'],
            bins=[0, 45, 90, 200],
            labels=['normal', 'elevated', 'high']
        )

        print("✓ Feature engineering completed")
        return df

    def encode_categoricals(self, df):
        """Encode categorical variables with LabelEncoder."""
        # You can adjust these based on your dataset
        cat_cols = [
            'gender',
            'previous_infection',
            'onset_speed',
            'age_group',
            'csf_category'
        ]
        cat_cols = [c for c in cat_cols if c in df.columns]

        self.categorical_columns = cat_cols

        for col in cat_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le

        print("✓ Categorical features encoded:", cat_cols)
        return df

    def split_and_scale(self, X, y, test_size=0.2, random_state=42):
        """Train-test split + scaling of numerical columns."""
        from sklearn.model_selection import train_test_split

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            stratify=y
        )

        # All numeric columns (after encoding)
        self.numerical_columns = X.select_dtypes(include=[np.number]).columns

        # Fit scaler on training numeric features only
        X_train.loc[:, self.numerical_columns] = self.scaler.fit_transform(
            X_train[self.numerical_columns]
        )
        X_test.loc[:, self.numerical_columns] = self.scaler.transform(
            X_test[self.numerical_columns]
        )

        return X_train, X_test, y_train, y_test

    def prepare_ml_data(self, test_size=0.2, random_state=42):
        """End-to-end preprocessing: feature engineering, encoding, scaling, split."""
        os.makedirs('data', exist_ok=True)
        os.makedirs('models', exist_ok=True)

        df = self.load_data()
        df = self.engineer_features(df)

        # Separate features and target
        self.feature_columns = [c for c in df.columns if c != self.target_name]
        X = df[self.feature_columns].copy()
        y = df[self.target_name].copy()

        # Encode categorical X
        X = self.encode_categoricals(X)

        # Encode target
        y_encoded = self.target_encoder.fit_transform(y)
        target_classes = list(self.target_encoder.classes_)

        # Train-test split + scaling
        X_train, X_test, y_train, y_test = self.split_and_scale(
            X, y_encoded, test_size=test_size, random_state=random_state
        )

        print(f"\n✓ Final ML-ready datasets:")
        print(f"  - X_train: {X_train.shape}")
        print(f"  - X_test:  {X_test.shape}")
        print(f"  - y_train: {y_train.shape}")
        print(f"  - y_test:  {y_test.shape}")
        print(f"  - Target classes: {target_classes}")

        # Save processed data as CSVs
        self.save_processed_data(X_train, X_test, y_train, y_test, target_classes)

        return X_train, X_test, y_train, y_test

    def save_processed_data(self, X_train, X_test, y_train, y_test, target_classes):
        """Save processed data, preprocessors, and preprocessing metadata."""
        # Data
        X_train.to_csv('data/X_train.csv', index=False)
        X_test.to_csv('data/X_test.csv', index=False)
        pd.DataFrame({'subtype': y_train}).to_csv('data/y_train.csv', index=False)
        pd.DataFrame({'subtype': y_test}).to_csv('data/y_test.csv', index=False)

        # Preprocessor objects
        joblib.dump(self.scaler, 'models/scaler.pkl')
        joblib.dump(self.label_encoders, 'models/label_encoders.pkl')
        joblib.dump(self.target_encoder, 'models/target_encoder.pkl')

        # Metadata JSON for training & deployment
        preprocessing_info = {
            'feature_columns': self.feature_columns,
            'numerical_columns': list(self.numerical_columns),
            'categorical_columns': list(self.categorical_columns),
            'target_name': self.target_name,
            'target_names': target_classes
        }

        with open('models/preprocessing_info.json', 'w') as f:
            json.dump(preprocessing_info, f, indent=2)

        print("✓ Processed data and preprocessing metadata saved")


if __name__ == "__main__":
    preprocessor = GBSPreprocessor()
    preprocessor.prepare_ml_data()
