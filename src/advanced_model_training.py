import os
import warnings
warnings.filterwarnings('ignore')

import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier

from sklearn.model_selection import (
    StratifiedKFold,
    GridSearchCV,
    learning_curve
)
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    f1_score
)
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.calibration import CalibratedClassifierCV


class GBSModelTrainer:
    """
    End-to-end training pipeline for GBS subtype prediction.

    Assumes that:
      - data/X_train.csv, data/X_test.csv, data/y_train.csv, data/y_test.csv exist
      - models/preprocessing_info.json exists and contains at least:
            { "feature_columns": [...], "target_names": [...] }
    """
    def __init__(self):
        self.models = {}
        self.results = {}
        self.best_model = None
        self.best_model_name = None
        self.selector = None
        self.selected_features = None
        self.preprocessing_info = None

        # Common CV strategy
        self.cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # ---------------------------------------------------------------------
    # DATA LOADING & FEATURE SELECTION
    # ---------------------------------------------------------------------
    def load_data(self):
        """Load the preprocessed data and preprocessing metadata."""
        try:
            # Optional: raw data for later analysis
            self.raw_data = pd.read_csv('data/synthetic_gbs_dataset.csv')

            # Preprocessed train/test splits
            self.X_train = pd.read_csv('data/X_train.csv')
            self.X_test = pd.read_csv('data/X_test.csv')
            self.y_train = pd.read_csv('data/y_train.csv')['subtype']
            self.y_test = pd.read_csv('data/y_test.csv')['subtype']

            with open('models/preprocessing_info.json', 'r') as f:
                self.preprocessing_info = json.load(f)

            print("✓ Data loaded successfully")
            print(f"  Training set: {self.X_train.shape}")
            print(f"  Test set:     {self.X_test.shape}")
            print(f"  Features:     {len(self.X_train.columns)}")

        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False

        return True

    def apply_feature_selection(self, k=20):
        """
        Apply univariate feature selection (ANOVA F-test).
        This helps reduce overfitting and focuses on clinically relevant predictors.
        """
        try:
            k = min(k, self.X_train.shape[1])  # don't exceed num features
            print(f"\n🔎 Applying feature selection (SelectKBest, k={k})...")

            self.selector = SelectKBest(score_func=f_classif, k=k)
            self.X_train = self.selector.fit_transform(self.X_train, self.y_train)
            self.X_test = self.selector.transform(self.X_test)

            # Map back to feature names
            original_feature_names = list(self.preprocessing_info.get(
                "feature_columns", []
            )) or list(pd.read_csv('data/X_train.csv').columns)

            selected_indices = self.selector.get_support(indices=True)
            self.selected_features = [original_feature_names[i] for i in selected_indices]

            print(f"✓ Feature selection complete. {k} features retained.")
            print("  Selected features:", self.selected_features)

        except Exception as e:
            print(f"❌ Error during feature selection: {e}")

    # ---------------------------------------------------------------------
    # MODEL INITIALISATION
    # ---------------------------------------------------------------------
    def initialize_models(self):
        """Initialize ML models and their hyperparameter grids for tuning."""
        self.models = {
            'Random Forest': {
                'model': RandomForestClassifier(random_state=42),
                'params': {
                    'n_estimators': [100, 200],
                    'max_depth': [10, 20, None],
                    'min_samples_split': [2, 5],
                    'class_weight': ['balanced']
                }
            },
            'Gradient Boosting': {
                'model': GradientBoostingClassifier(random_state=42),
                'params': {
                    'n_estimators': [100, 200],
                    'learning_rate': [0.05, 0.1],
                    'max_depth': [3, 5]
                }
            },
            'SVM': {
                'model': SVC(random_state=42, probability=True),
                'params': {
                    'C': [0.1, 1, 10],
                    'kernel': ['rbf', 'linear'],
                    'class_weight': ['balanced']
                }
            },
            'Logistic Regression': {
                'model': LogisticRegression(random_state=42, max_iter=2000),
                'params': {
                    'C': [0.1, 1, 10],
                    'penalty': ['l2'],
                    'class_weight': ['balanced'],
                    'solver': ['lbfgs', 'liblinear']
                }
            },
            'K-Nearest Neighbors': {
                'model': KNeighborsClassifier(),
                'params': {
                    'n_neighbors': [3, 5, 7],
                    'weights': ['uniform', 'distance']
                }
            }
        }
        print("✓ Models initialized with hyperparameter grids")

    # ---------------------------------------------------------------------
    # EVALUATION
    # ---------------------------------------------------------------------
    def evaluate_model(self, model, X_test, y_test, model_name):
        """Evaluate a model on the test set and compute key metrics."""
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None

        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')

        print(f"   ✅ Test Accuracy: {accuracy:.3f}")
        print(f"   ✅ Test F1 (weighted): {f1:.3f}")

        return {
            'model': model,
            'accuracy': accuracy,
            'f1_score': f1,
            'predictions': y_pred,
            'probabilities': y_pred_proba,
            'classification_report': classification_report(y_test, y_pred, output_dict=True),
            'confusion_matrix': confusion_matrix(y_test, y_pred)
        }

    # ---------------------------------------------------------------------
    # TRAINING & MODEL SELECTION
    # ---------------------------------------------------------------------
    def train_and_evaluate_models(self):
        """Hyperparameter tuning, training, and evaluation for all models."""
        print("\n🚀 Training and Evaluating Models (with GridSearchCV)...")
        print("=" * 60)

        for name, model_info in self.models.items():
            print(f"\n📊 {name}: Hyperparameter tuning + training")

            base_model = model_info['model']
            param_grid = model_info['params']

            try:
                grid = GridSearchCV(
                    estimator=base_model,
                    param_grid=param_grid,
                    cv=self.cv,
                    scoring='f1_weighted',
                    n_jobs=-1,
                    refit=True
                )
                grid.fit(self.X_train, self.y_train)

                best_model = grid.best_estimator_
                cv_mean = grid.best_score_
                cv_std = grid.cv_results_['mean_test_score'].std()

                print(f"   🔧 Best params: {grid.best_params_}")
                print(f"   📌 CV F1 (weighted): {cv_mean:.3f} (±{cv_std:.3f})")

                # Evaluate best model on test set
                eval_results = self.evaluate_model(best_model, self.X_test, self.y_test, name)
                eval_results.update({
                    'cv_mean': cv_mean,
                    'cv_std': cv_std,
                    'best_params': grid.best_params_
                })

                self.results[name] = eval_results

            except Exception as e:
                print(f"   ❌ Error training {name}: {e}")

        # Select best-performing model across all algorithms
        self.select_best_model()

    def select_best_model(self):
        """Select the best model based on CV F1-score."""
        best_score = -np.inf
        best_name = None

        for name, results in self.results.items():
            cv_score = results.get('cv_mean', -np.inf)
            if cv_score > best_score:
                best_score = cv_score
                best_name = name

        if best_name is None:
            print("❌ No models were successfully trained.")
            return

        self.best_model_name = best_name
        self.best_model = self.results[best_name]

        print("\n🏆 BEST MODEL SELECTED")
        print(f"   Model: {self.best_model_name}")
        print(f"   CV F1 (weighted): {self.best_model['cv_mean']:.3f}")
        print(f"   Test Accuracy: {self.best_model['accuracy']:.3f}")
        print(f"   Test F1 (weighted): {self.best_model['f1_score']:.3f}")

    # ---------------------------------------------------------------------
    # VISUALISATIONS
    # ---------------------------------------------------------------------
    def plot_model_comparison(self):
        """Create comparison plots of all models."""
        if not self.results:
            print("⚠ No results to plot.")
            return

        print("\n📊 Generating model comparison plots...")

        fig, axes = plt.subplots(2, 2, figsize=(15, 12))

        models = list(self.results.keys())
        accuracies = [self.results[name]['accuracy'] for name in models]
        cv_scores = [self.results[name]['cv_mean'] for name in models]

        # Accuracy comparison
        axes[0, 0].bar(models, accuracies, alpha=0.7)
        axes[0, 0].set_title('Model Accuracy Comparison')
        axes[0, 0].set_ylabel('Test Accuracy')
        axes[0, 0].tick_params(axis='x', rotation=45)

        # CV score comparison
        axes[0, 1].bar(models, cv_scores, alpha=0.7)
        axes[0, 1].set_title('Cross-Validation F1 (Weighted) Comparison')
        axes[0, 1].set_ylabel('CV F1 (Weighted)')
        axes[0, 1].tick_params(axis='x', rotation=45)

        # Confusion matrix for best model
        if self.best_model_name is None:
            self.select_best_model()
        best_name = self.best_model_name

        cm = self.results[best_name]['confusion_matrix']
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[1, 0])
        axes[1, 0].set_title(f'Confusion Matrix - {best_name}')
        axes[1, 0].set_xlabel('Predicted')
        axes[1, 0].set_ylabel('Actual')

        # Feature importance for tree-based best model (if available)
        best_model = self.results[best_name]['model']
        if hasattr(best_model, 'feature_importances_') and self.selected_features is not None:
            fi = best_model.feature_importances_
            importance_df = (
                pd.DataFrame({'feature': self.selected_features, 'importance': fi})
                .sort_values('importance', ascending=False)
                .head(10)
            )
            axes[1, 1].barh(importance_df['feature'], importance_df['importance'])
            axes[1, 1].set_title(f'Top 10 Feature Importances - {best_name}')
            axes[1, 1].set_xlabel('Importance')
        else:
            axes[1, 1].axis('off')
            axes[1, 1].set_title('Feature importance not available')

        plt.tight_layout()
        os.makedirs('models', exist_ok=True)
        plt.savefig('models/model_comparison.png', dpi=300, bbox_inches='tight')
        plt.show()

    def plot_learning_curves(self):
        """Plot learning curves for the best model."""
        if self.best_model_name is None:
            self.select_best_model()
        if self.best_model_name is None:
            return

        model = self.best_model['model']
        print(f"\n📈 Plotting learning curves for {self.best_model_name}...")

        train_sizes, train_scores, test_scores = learning_curve(
            model,
            self.X_train,
            self.y_train,
            cv=self.cv,
            n_jobs=-1,
            train_sizes=np.linspace(0.1, 1.0, 10),
            scoring='accuracy'
        )

        plt.figure(figsize=(10, 6))
        plt.plot(train_sizes, np.mean(train_scores, axis=1), 'o-', label='Training score')
        plt.plot(train_sizes, np.mean(test_scores, axis=1), 'o-', label='Cross-validation score')
        plt.title(f'Learning Curves - {self.best_model_name}')
        plt.xlabel('Training examples')
        plt.ylabel('Accuracy')
        plt.legend(loc='best')
        plt.grid(True)

        os.makedirs('models', exist_ok=True)
        plt.savefig('models/learning_curves.png', dpi=300, bbox_inches='tight')
        plt.show()

    # ---------------------------------------------------------------------
    # EXPLAINABILITY (SHAP)
    # ---------------------------------------------------------------------
    def generate_shap_explanations(self):
        """
        Generate SHAP summary plot for the best model (if tree-based and shap installed).
        """
        if self.best_model_name is None:
            self.select_best_model()
        if self.best_model_name is None:
            return

        model = self.best_model['model']

        # Only attempt for tree-based models
        if not isinstance(model, (RandomForestClassifier, GradientBoostingClassifier)):
            print("\nℹ SHAP explanation currently implemented only for tree-based models.")
            return

        try:
            import shap
            print("\n🧠 Generating SHAP explanations for best model...")

            # Build a SHAP explainer on training data
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(self.X_train)

            # SHAP summary plot
            plt.figure()
            shap.summary_plot(
                shap_values,
                features=self.X_train,
                feature_names=self.selected_features or None,
                show=False
            )
            os.makedirs('models', exist_ok=True)
            plt.tight_layout()
            plt.savefig('models/shap_summary.png', dpi=300, bbox_inches='tight')
            plt.close()

            print("✓ SHAP summary plot saved to models/shap_summary.png")

        except ImportError:
            print("⚠ shap library is not installed. Run `pip install shap` to enable explainability.")
        except Exception as e:
            print(f"❌ Error generating SHAP explanations: {e}")

    # ---------------------------------------------------------------------
    # REPORTING
    # ---------------------------------------------------------------------
    def generate_detailed_report(self):
        """Print a comprehensive evaluation report for all models."""
        if not self.results:
            print("⚠ No results available to report.")
            return

        print("\n" + "=" * 60)
        print("📈 COMPREHENSIVE MODEL EVALUATION REPORT")
        print("=" * 60)

        target_names = self.preprocessing_info.get('target_names', [])

        for name, results in self.results.items():
            print(f"\n🔍 {name.upper()}")
            print(f"   Test Accuracy: {results['accuracy']:.3f}")
            print(f"   Test F1 (weighted): {results['f1_score']:.3f}")
            print(f"   CV F1 (weighted): {results['cv_mean']:.3f} (±{results['cv_std']:.3f})")

            report = results['classification_report']
            if target_names:
                print("\n   Per-class metrics:")
                for class_name in target_names:
                    if class_name in report:
                        prec = report[class_name]['precision']
                        rec = report[class_name]['recall']
                        f1 = report[class_name]['f1-score']
                        print(f"     {class_name}: Precision={prec:.3f}, Recall={rec:.3f}, F1={f1:.3f}")

    # ---------------------------------------------------------------------
    # SAVING BEST MODEL (WITH OPTIONAL CALIBRATION)
    # ---------------------------------------------------------------------
    def save_best_model(self, calibrate=True):
        """
        Save the best model and associated metrics.
        Optionally wrap it in a calibrated classifier for better probability estimates.
        """
        if self.best_model_name is None:
            self.select_best_model()
        if self.best_model_name is None:
            print("❌ No best model available to save.")
            return

        best_name = self.best_model_name
        model = self.best_model['model']
        calibrated_flag = False

        if calibrate and hasattr(model, "predict_proba"):
            print(f"\n🧪 Calibrating probabilities for {best_name} (isotonic)...")
            try:
                calibrated_model = CalibratedClassifierCV(
                    model, method='isotonic', cv=self.cv
                )
                calibrated_model.fit(self.X_train, self.y_train)
                model_to_save = calibrated_model
                calibrated_flag = True
                print("✓ Calibration complete.")
            except Exception as e:
                print(f"⚠ Calibration failed ({e}). Saving uncalibrated model.")
                model_to_save = model
        else:
            model_to_save = model

        os.makedirs('models', exist_ok=True)
        model_path = 'models/best_gbs_model.pkl'
        joblib.dump(model_to_save, model_path)

        model_metrics = {
            'model_name': best_name,
            'accuracy': self.best_model['accuracy'],
            'f1_score': self.best_model['f1_score'],
            'cv_score': self.best_model['cv_mean'],
            'cv_std': self.best_model['cv_std'],
            'selected_features': self.selected_features,
            'target_names': self.preprocessing_info.get('target_names', []),
            'best_params': self.best_model.get('best_params', {}),
            'calibrated': calibrated_flag
        }

        metrics_path = 'models/model_metrics.json'
        with open(metrics_path, 'w') as f:
            json.dump(model_metrics, f, indent=2)

        print(f"\n💾 Model saved:   {model_path}")
        print(f"📊 Metrics saved: {metrics_path}")


# -------------------------------------------------------------------------
# MAIN
# -------------------------------------------------------------------------
def main():
    """Main execution function."""
    print("🎯 GBS Subtype Prediction - Advanced Model Training")
    print("=" * 60)

    trainer = GBSModelTrainer()

    # Load data
    if not trainer.load_data():
        return

    # Feature selection (tune k if needed)
    trainer.apply_feature_selection(k=20)

    # Initialize models
    trainer.initialize_models()

    # Train + evaluate with hyperparameter tuning
    trainer.train_and_evaluate_models()

    # Visualisations
    trainer.plot_model_comparison()
    trainer.plot_learning_curves()

    # Explainability (for tree-based best model)
    trainer.generate_shap_explanations()

    # Detailed text report
    trainer.generate_detailed_report()

    # Save best model (with probability calibration)
    trainer.save_best_model(calibrate=True)

    print("\n✅ Advanced model training completed successfully!")
    print("📁 Check the 'models/' directory for saved models, metrics, and plots.")


if __name__ == "__main__":
    main()
