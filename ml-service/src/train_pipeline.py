"""
ML Training Pipeline for Smart Medical Advisor.
Handles two datasets with different sizes and characteristics:
- Basic: Kaggle CVD (~70K rows, 11 features)
- Clinical: Heart Failure Prediction (918 rows, 11 features)

Key design decisions:
1. Basic (70K): scale_pos_weight for imbalance (NO undersampling - preserves data)
2. Clinical (918): SMOTE on training folds + strong regularization (prevents overfitting)
3. Stacking ensemble (better than Voting for correlated tree-based models)
4. Probability calibration (critical for medical risk scores)
5. SHAP-compatible models (TreeExplainer requires sklearn-compatible trees)
"""
import os
import warnings
from typing import Tuple, Dict

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score, 
    matthews_corrcoef, brier_score_loss, classification_report, confusion_matrix
)
import xgboost as xgb
from catboost import CatBoostClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib

warnings.filterwarnings("ignore")

# =============================================================================
# CONFIGURATION
# =============================================================================
RANDOM_STATE = 42
N_FOLDS = 5
TEST_SIZE = 0.15
VAL_SIZE = 0.15

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# =============================================================================
# SYNTHETIC DATA GENERATION (Mimics real datasets for initial training)
# In production, replace with: pd.read_csv(os.path.join(DATA_DIR, "cardio_train.csv"))
# =============================================================================

def generate_basic_dataset(n_samples: int = 70000, random_state: int = 42) -> pd.DataFrame:
    """
    Generate synthetic data mimicking Kaggle Cardiovascular Disease dataset.
    Features: age, gender, height, weight, ap_hi, ap_lo, cholesterol, gluc, smoke, alco, active
    Target: cardio (0/1)
    Class distribution: ~65% healthy, ~35% disease
    """
    np.random.seed(random_state)
    
    n_disease = int(n_samples * 0.35)
    n_healthy = n_samples - n_disease
    
    def _generate_group(n, disease_flag):
        data = {}
        data["age"] = np.clip(np.random.normal(55 if disease_flag else 45, 12, n).astype(int), 18, 120)
        data["gender"] = np.random.choice([1, 2], n, p=[0.55, 0.45] if disease_flag else [0.45, 0.55])
        data["height"] = np.clip(np.random.normal(165 if disease_flag else 170, 10, n).astype(int), 140, 200)
        data["weight"] = np.clip(np.random.normal(85 if disease_flag else 70, 15, n), 40, 150)
        data["ap_hi"] = np.clip(np.random.normal(150 if disease_flag else 125, 20, n).astype(int), 80, 250)
        data["ap_lo"] = np.clip(np.random.normal(95 if disease_flag else 80, 12, n).astype(int), 50, 150)
        
        chol_probs = [0.3, 0.4, 0.3] if disease_flag else [0.7, 0.25, 0.05]
        data["cholesterol"] = np.random.choice([1, 2, 3], n, p=chol_probs)
        
        gluc_probs = [0.4, 0.4, 0.2] if disease_flag else [0.8, 0.15, 0.05]
        data["gluc"] = np.random.choice([1, 2, 3], n, p=gluc_probs)
        
        data["smoke"] = np.random.choice([0, 1], n, p=[0.6, 0.4] if disease_flag else [0.85, 0.15])
        data["alco"] = np.random.choice([0, 1], n, p=[0.7, 0.3] if disease_flag else [0.9, 0.1])
        data["active"] = np.random.choice([0, 1], n, p=[0.6, 0.4] if disease_flag else [0.3, 0.7])
        
        data["cardio"] = [1 if disease_flag else 0] * n
        return pd.DataFrame(data)
    
    df = pd.concat([_generate_group(n_disease, True), _generate_group(n_healthy, False)], ignore_index=True)
    return df.sample(frac=1, random_state=random_state).reset_index(drop=True)


def generate_clinical_dataset(n_samples: int = 918, random_state: int = 42) -> pd.DataFrame:
    """
    Generate synthetic data mimicking Heart Failure Prediction dataset (918 rows).
    Features: Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, 
              RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope
    Target: HeartDisease (0/1)
    Real distribution: 508 disease (55.3%), 410 healthy (44.7%)
    """
    np.random.seed(random_state)
    
    n_disease = int(n_samples * 0.553)
    n_healthy = n_samples - n_disease
    
    def _generate_group(n, disease_flag):
        data = {}
        data["Age"] = np.clip(np.random.normal(58 if disease_flag else 50, 10, n).astype(int), 28, 77)
        data["Sex"] = np.random.choice(["M", "F"], n, p=[0.79, 0.21] if disease_flag else [0.55, 0.45])
        
        cp_probs = [0.05, 0.15, 0.20, 0.60] if disease_flag else [0.20, 0.35, 0.30, 0.15]
        data["ChestPainType"] = np.random.choice(["TA", "ATA", "NAP", "ASY"], n, p=cp_probs)
        
        data["RestingBP"] = np.clip(np.random.normal(140 if disease_flag else 130, 18, n).astype(int), 80, 200)
        data["RestingBP"] = np.where(data["RestingBP"] == 0, 120, data["RestingBP"])
        
        chol = np.clip(np.random.normal(250 if disease_flag else 220, 60, n), 100, 600)
        missing_mask = np.random.random(n) < 0.05
        chol[missing_mask] = 0
        data["Cholesterol"] = chol.astype(int)
        
        data["FastingBS"] = np.random.choice([0, 1], n, p=[0.65, 0.35] if disease_flag else [0.85, 0.15])
        
        ecg_probs = [0.50, 0.30, 0.20] if disease_flag else [0.60, 0.25, 0.15]
        data["RestingECG"] = np.random.choice(["Normal", "ST", "LVH"], n, p=ecg_probs)
        
        data["MaxHR"] = np.clip(np.random.normal(130 if disease_flag else 155, 20, n).astype(int), 60, 202)
        data["ExerciseAngina"] = np.random.choice(["N", "Y"], n, p=[0.45, 0.55] if disease_flag else [0.75, 0.25])
        
        data["Oldpeak"] = np.round(np.clip(np.random.exponential(1.5 if disease_flag else 0.5, n), -2.6, 6.2), 1)
        
        slope_probs = [0.15, 0.60, 0.25] if disease_flag else [0.40, 0.45, 0.15]
        data["ST_Slope"] = np.random.choice(["Up", "Flat", "Down"], n, p=slope_probs)
        
        data["HeartDisease"] = [1 if disease_flag else 0] * n
        return pd.DataFrame(data)
    
    df = pd.concat([_generate_group(n_disease, True), _generate_group(n_healthy, False)], ignore_index=True)
    return df.sample(frac=1, random_state=random_state).reset_index(drop=True)


# =============================================================================
# PREPROCESSING
# =============================================================================

def preprocess_basic(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, list]:
    """Preprocess Basic dataset. Returns X, y, feature_names."""
    feature_cols = ["age", "gender", "height", "weight", "ap_hi", "ap_lo", 
                    "cholesterol", "gluc", "smoke", "alco", "active"]
    df = df.copy()
    # Age in Kaggle dataset is in days. Convert to years.
    df["age"] = (df["age"] / 365.25).astype(int)
    
    X = df[feature_cols].values
    y = df["cardio"].values
    return X, y, feature_cols


def preprocess_clinical(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, list]:
    """Preprocess Clinical dataset with encoding."""
    df = df.copy()
    
    # Handle missing cholesterol (0 values) - median imputation
    df.loc[df["Cholesterol"] == 0, "Cholesterol"] = df[df["Cholesterol"] > 0]["Cholesterol"].median()
    
    # Encode categoricals
    df["Sex"] = df["Sex"].map({"M": 1, "F": 0})
    df["ChestPainType"] = df["ChestPainType"].map({"TA": 0, "ATA": 1, "NAP": 2, "ASY": 3})
    df["RestingECG"] = df["RestingECG"].map({"Normal": 0, "ST": 1, "LVH": 2})
    df["ExerciseAngina"] = df["ExerciseAngina"].map({"N": 0, "Y": 1})
    df["ST_Slope"] = df["ST_Slope"].map({"Up": 0, "Flat": 1, "Down": 2})
    
    feature_cols = ["Age", "Sex", "ChestPainType", "RestingBP", "Cholesterol",
                    "FastingBS", "RestingECG", "MaxHR", "ExerciseAngina", "Oldpeak", "ST_Slope"]
    X = df[feature_cols].values.astype(float)
    y = df["HeartDisease"].values
    return X, y, feature_cols


# =============================================================================
# MODEL BUILDING
# =============================================================================

def build_basic_model() -> StackingClassifier:
    """Build Stacking ensemble for Basic mode (70K rows)."""
    xgb_clf = xgb.XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.1,
        subsample=0.8, colsample_bytree=0.8,
        random_state=RANDOM_STATE, eval_metric="logloss",
        use_label_encoder=False, n_jobs=-1,
    )
    
    cat_clf = CatBoostClassifier(
        iterations=200, depth=6, learning_rate=0.1,
        random_seed=RANDOM_STATE, verbose=False, loss_function="Logloss",
    )
    
    return StackingClassifier(
        estimators=[("xgb", xgb_clf), ("cat", cat_clf)],
        final_estimator=LogisticRegression(max_iter=1000, class_weight="balanced", random_state=RANDOM_STATE),
        cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE),
        passthrough=False, n_jobs=-1,
    )


def build_clinical_model() -> ImbPipeline:
    """Build Stacking ensemble for Clinical mode (918 rows) with SMOTE."""
    xgb_clf = xgb.XGBClassifier(
        n_estimators=100, max_depth=3, learning_rate=0.05,
        subsample=0.7, colsample_bytree=0.7,
        reg_lambda=5, reg_alpha=1,
        random_state=RANDOM_STATE, eval_metric="logloss",
        use_label_encoder=False, n_jobs=-1,
    )
    
    cat_clf = CatBoostClassifier(
        iterations=100, depth=3, learning_rate=0.05,
        l2_leaf_reg=5, random_seed=RANDOM_STATE,
        verbose=False, loss_function="Logloss",
    )
    
    stack = StackingClassifier(
        estimators=[("xgb", xgb_clf), ("cat", cat_clf)],
        final_estimator=LogisticRegression(max_iter=1000, class_weight="balanced", C=0.5, random_state=RANDOM_STATE),
        cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE),
        passthrough=False, n_jobs=-1,
    )
    
    return ImbPipeline([("smote", SMOTE(random_state=RANDOM_STATE, k_neighbors=5)), ("stack", stack)])


# =============================================================================
# TRAINING & EVALUATION
# =============================================================================

def evaluate_model(model, X_test: np.ndarray, y_test: np.ndarray, model_name: str) -> Dict[str, float]:
    """Comprehensive model evaluation with medical-relevant metrics."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "roc_auc": roc_auc_score(y_test, y_prob),
        "f1": f1_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "mcc": matthews_corrcoef(y_test, y_pred),
        "brier_score": brier_score_loss(y_test, y_prob),
    }
    
    print(f"\n{'='*60}")
    print(f"  {model_name} - Evaluation Results")
    print(f"{'='*60}")
    print(f"  ROC-AUC:     {metrics['roc_auc']:.4f}")
    print(f"  F1-Score:    {metrics['f1']:.4f}")
    print(f"  Precision:   {metrics['precision']:.4f}")
    print(f"  Recall:      {metrics['recall']:.4f}")
    print(f"  MCC:         {metrics['mcc']:.4f}")
    print(f"  Brier Score: {metrics['brier_score']:.4f} (lower = better calibration)")
    print(f"{'='*60}")
    print(f"\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Healthy", "Disease"]))
    
    return metrics


def calibrate_model(model, X_val: np.ndarray, y_val: np.ndarray):
    """Calibrate probabilities using isotonic regression."""
    calibrated = CalibratedClassifierCV(model, method="isotonic", cv="prefit")
    calibrated.fit(X_val, y_val)
    return calibrated


def train_basic_model():
    """Train and save Basic model."""
    print("\n" + "="*70)
    print("  BASIC MODEL TRAINING (Kaggle CVD Dataset, ~70K rows)")
    print("="*70)
    
    csv_path = os.path.join(DATA_DIR, "cardio_train.csv")
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path, sep=';')
    print(f"\nDataset shape: {df.shape}")
    print(f"Class distribution: {df['cardio'].value_counts().to_dict()}")
    
    X, y, feature_names = preprocess_basic(df)
    
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=TEST_SIZE + VAL_SIZE, random_state=RANDOM_STATE, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=TEST_SIZE / (TEST_SIZE + VAL_SIZE), 
        random_state=RANDOM_STATE, stratify=y_temp)
    
    print(f"\nTrain: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    model = build_basic_model()
    scale_pos = (y_train == 0).sum() / (y_train == 1).sum()
    print(f"\nscale_pos_weight: {scale_pos:.2f}")
    
    for name, estimator in model.estimators:
        if hasattr(estimator, "scale_pos_weight"):
            estimator.set_params(scale_pos_weight=scale_pos)
        elif hasattr(estimator, "class_weight"):
            estimator.set_params(class_weight="balanced")
    
    print("\nTraining Stacking ensemble...")
    model.fit(X_train, y_train)
    
    print("\nCalibrating probabilities...")
    calibrated_model = calibrate_model(model, X_val, y_val)
    
    metrics = evaluate_model(calibrated_model, X_test, y_test, "Basic Model")
    
    print("\n5-Fold Stratified CV (ROC-AUC):")
    cv_scores = cross_val_score(model, X_train, y_train, 
                                 cv=StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=RANDOM_STATE),
                                 scoring="roc_auc", n_jobs=-1)
    print(f"  Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")
    
    model_path = os.path.join(MODELS_DIR, "basic_model_v1.joblib")
    joblib.dump({
        "model": calibrated_model,
        "feature_names": feature_names,
        "metrics": metrics,
        "cv_scores": cv_scores.tolist(),
        "version": "basic_v1.0",
    }, model_path)
    print(f"\n✅ Model saved: {model_path}")
    
    return calibrated_model, feature_names, metrics


def train_clinical_model():
    """Train and save Clinical model."""
    print("\n" + "="*70)
    print("  CLINICAL MODEL TRAINING (Heart Failure, 918 rows)")
    print("="*70)
    
    csv_path = os.path.join(DATA_DIR, "heart.csv")
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"\nDataset shape: {df.shape}")
    print(f"Class distribution: {df['HeartDisease'].value_counts().to_dict()}")
    
    X, y, feature_names = preprocess_clinical(df)
    
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=TEST_SIZE + VAL_SIZE, random_state=RANDOM_STATE, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=TEST_SIZE / (TEST_SIZE + VAL_SIZE),
        random_state=RANDOM_STATE, stratify=y_temp)
    
    print(f"\nTrain: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    print(f"Train class distribution: {np.bincount(y_train)}")
    
    pipeline = build_clinical_model()
    
    print("\nTraining Stacking ensemble with SMOTE...")
    pipeline.fit(X_train, y_train)
    
    stack = pipeline.named_steps["stack"]
    
    print("\nCalibrating probabilities...")
    calibrated_model = calibrate_model(stack, X_val, y_val)
    
    metrics = evaluate_model(calibrated_model, X_test, y_test, "Clinical Model")
    
    print("\n5-Fold Stratified CV (ROC-AUC) on original data:")
    cv_scores = cross_val_score(pipeline, X_train, y_train,
                                 cv=StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=RANDOM_STATE),
                                 scoring="roc_auc", n_jobs=-1)
    print(f"  Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")
    
    model_path = os.path.join(MODELS_DIR, "clinical_model_v1.joblib")
    joblib.dump({
        "model": calibrated_model,
        "feature_names": feature_names,
        "metrics": metrics,
        "cv_scores": cv_scores.tolist(),
        "version": "clinical_v1.0",
    }, model_path)
    print(f"\n✅ Model saved: {model_path}")
    
    return calibrated_model, feature_names, metrics


if __name__ == "__main__":
    print("\n" + "="*70)
    print("  SMART MEDICAL ADVISOR - ML Training Pipeline")
    print("="*70)
    
    basic_model, basic_features, basic_metrics = train_basic_model()
    clinical_model, clinical_features, clinical_metrics = train_clinical_model()
    
    print("\n" + "="*70)
    print("  TRAINING COMPLETE")
    print("="*70)
    print(f"\nBasic Model:    ROC-AUC = {basic_metrics['roc_auc']:.4f}")
    print(f"Clinical Model: ROC-AUC = {clinical_metrics['roc_auc']:.4f}")
    print(f"\nModels saved to: {MODELS_DIR}")