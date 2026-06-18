"""
SHAP Explainability Engine for Smart Medical Advisor.
Uses TreeExplainer for tree-based ensemble models.
Returns structured feature impact data for frontend visualization.
"""
from typing import Dict, List, Any
import numpy as np
import shap


def get_shap_values(model, patient_data: np.ndarray, feature_names: list) -> Dict[str, Any]:
    """
    Calculate SHAP values for a single patient prediction.
    
    Args:
        model: Trained sklearn-compatible model
        patient_data: 2D array of shape (1, n_features)
        feature_names: List of feature names
    
    Returns:
        Dictionary with shap_values, base_value, and top_factors
    """
    # Handle CalibratedClassifierCV wrapper
    if hasattr(model, "calibrated_classifiers_"):
        base_model = model.calibrated_classifiers_[0].estimator
    else:
        base_model = model
    
    try:
        # Try TreeExplainer on XGBoost component
        if hasattr(base_model, "named_estimators_") and "xgb" in base_model.named_estimators_:
            xgb_model = base_model.named_estimators_["xgb"]
            explainer = shap.TreeExplainer(xgb_model)
            shap_values = explainer.shap_values(patient_data)
            base_value = explainer.expected_value
            
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
                base_value = base_value[1] if isinstance(base_value, (list, np.ndarray)) else base_value
            
        elif hasattr(base_model, "estimators_"):
            tree_model = base_model.estimators_[0]
            explainer = shap.TreeExplainer(tree_model)
            shap_values = explainer.shap_values(patient_data)
            base_value = explainer.expected_value
            
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
                base_value = base_value[1] if isinstance(base_value, (list, np.ndarray)) else base_value
        else:
            explainer = shap.KernelExplainer(base_model.predict_proba, shap.sample(patient_data, 100))
            shap_values = explainer.shap_values(patient_data)[1]
            base_value = explainer.expected_value[1]
            
    except Exception as e:
        print(f"SHAP TreeExplainer failed: {e}. Using fallback.")
        return _fallback_feature_importance(base_model, patient_data, feature_names)
    
    shap_values = np.array(shap_values).flatten()
    
    shap_dict = {}
    for name, value in zip(feature_names, shap_values):
        shap_dict[name] = round(float(value), 4)
    
    sorted_factors = sorted(
        [(name, value) for name, value in shap_dict.items()],
        key=lambda x: abs(x[1]),
        reverse=True
    )[:5]
    
    top_factors = []
    for name, impact in sorted_factors:
        direction = "increases" if impact > 0 else "decreases"
        top_factors.append({
            "feature": name,
            "impact": round(impact, 4),
            "direction": direction,
            "description": _get_feature_description(name, impact)
        })
    
    return {
        "shap_values": shap_dict,
        "base_value": round(float(base_value), 4),
        "top_factors": top_factors,
    }


def _fallback_feature_importance(model, patient_data: np.ndarray, feature_names: list) -> Dict[str, Any]:
    """Fallback using permutation importance approximation."""
    base_prob = model.predict_proba(patient_data)[0, 1]
    
    shap_dict = {}
    for i, name in enumerate(feature_names):
        perturbed = patient_data.copy()
        perturbed[0, i] = np.mean(perturbed[:, i])
        perturbed_prob = model.predict_proba(perturbed)[0, 1]
        shap_dict[name] = round(float(base_prob - perturbed_prob), 4)
    
    sorted_factors = sorted(
        [(name, value) for name, value in shap_dict.items()],
        key=lambda x: abs(x[1]),
        reverse=True
    )[:5]
    
    top_factors = []
    for name, impact in sorted_factors:
        direction = "increases" if impact > 0 else "decreases"
        top_factors.append({
            "feature": name,
            "impact": round(impact, 4),
            "direction": direction,
            "description": _get_feature_description(name, impact)
        })
    
    return {
        "shap_values": shap_dict,
        "base_value": round(float(base_prob), 4),
        "top_factors": top_factors,
    }


def _get_feature_description(feature_name: str, impact: float) -> str:
    """Generate human-readable description for a feature impact."""
    descriptions = {
        "age": "Age of the patient",
        "gender": "Patient's gender (1=Female, 2=Male)",
        "height": "Height in centimeters",
        "weight": "Body weight in kilograms",
        "ap_hi": "Systolic blood pressure",
        "ap_lo": "Diastolic blood pressure",
        "cholesterol": "Cholesterol level (1=normal, 2=above, 3=well above)",
        "gluc": "Glucose level (1=normal, 2=above, 3=well above)",
        "smoke": "Smoking status",
        "alco": "Alcohol consumption",
        "active": "Physical activity level",
        "Age": "Age of the patient",
        "Sex": "Patient's sex (0=Female, 1=Male)",
        "ChestPainType": "Type of chest pain (0=TA, 1=ATA, 2=NAP, 3=ASY)",
        "RestingBP": "Resting blood pressure",
        "Cholesterol": "Serum cholesterol in mg/dl",
        "FastingBS": "Fasting blood sugar > 120 mg/dl",
        "RestingECG": "Resting ECG results (0=Normal, 1=ST, 2=LVH)",
        "MaxHR": "Maximum heart rate achieved",
        "ExerciseAngina": "Exercise-induced angina",
        "Oldpeak": "ST depression induced by exercise",
        "ST_Slope": "Slope of peak exercise ST segment",
    }
    
    base = descriptions.get(feature_name, feature_name)
    direction = "increases" if impact > 0 else "decreases"
    return f"{base} - {direction} risk by {abs(impact):.3f}"


def get_global_feature_importance(model, feature_names: list) -> List[Dict[str, Any]]:
    """Get global feature importance from the model."""
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "named_estimators_") and hasattr(model.named_estimators_.get("xgb"), "feature_importances_"):
        importances = model.named_estimators_["xgb"].feature_importances_
    else:
        return []
    
    result = []
   