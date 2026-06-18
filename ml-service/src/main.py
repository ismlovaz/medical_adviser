"""
Smart Medical Advisor - ML Microservice
FastAPI application serving two cardiovascular risk prediction models.
"""
import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .schemas import (
    BasicScreeningRequest, 
    ClinicalScreeningRequest, 
    PredictionResponse, 
    HealthCheckResponse
)
from .explainability import get_shap_values

# =============================================================================
# CONFIGURATION
# =============================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Global model storage
models = {
    "basic": None,
    "clinical": None,
}
model_metadata = {
    "basic": {},
    "clinical": {},
}

# =============================================================================
# LIFESPAN - Load models on startup
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models into memory on startup."""
    logger.info("Loading ML models...")
    
    # Load Basic model
    basic_path = os.path.join(MODELS_DIR, "basic_model_v1.joblib")
    if os.path.exists(basic_path):
        basic_data = joblib.load(basic_path)
        models["basic"] = basic_data["model"]
        model_metadata["basic"] = {
            "feature_names": basic_data.get("feature_names", []),
            "version": basic_data.get("version", "basic_v1.0"),
            "metrics": basic_data.get("metrics", {}),
        }
        logger.info(f"✅ Basic model loaded: {model_metadata['basic']['version']}")
    else:
        logger.warning(f"⚠️ Basic model not found at {basic_path}")
    
    # Load Clinical model
    clinical_path = os.path.join(MODELS_DIR, "clinical_model_v1.joblib")
    if os.path.exists(clinical_path):
        clinical_data = joblib.load(clinical_path)
        models["clinical"] = clinical_data["model"]
        model_metadata["clinical"] = {
            "feature_names": clinical_data.get("feature_names", []),
            "version": clinical_data.get("version", "clinical_v1.0"),
            "metrics": clinical_data.get("metrics", {}),
        }
        logger.info(f"✅ Clinical model loaded: {model_metadata['clinical']['version']}")
    else:
        logger.warning(f"⚠️ Clinical model not found at {clinical_path}")
    
    yield
    
    # Cleanup
    logger.info("Shutting down ML service...")
    models["basic"] = None
    models["clinical"] = None


# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="Smart Medical Advisor - ML API",
    description="Cardiovascular risk prediction using ensemble ML + SHAP explainability",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint for Docker and monitoring."""
    return HealthCheckResponse(
        status="healthy",
        models_loaded={
            "basic": models["basic"] is not None,
            "clinical": models["clinical"] is not None,
        }
    )


# =============================================================================
# PREDICTION ENDPOINTS
# =============================================================================

def _make_prediction(
    model_key: str, 
    patient_array: np.ndarray, 
    feature_names: list
) -> Dict[str, Any]:
    """Core prediction logic with SHAP explainability."""
    model = models[model_key]
    if model is None:
        raise HTTPException(status_code=503, detail=f"{model_key} model not loaded")
    
    # Predict risk score (probability of disease)
    risk_prob = model.predict_proba(patient_array)[0, 1]
    risk_score = float(np.clip(risk_prob, 0.0, 1.0))
    
    # SHAP explainability
    shap_result = get_shap_values(model, patient_array, feature_names)
    
    return {
        "risk_score": risk_score,
        "risk_percentage": round(risk_score * 100, 2),
        "mode": model_key,
        "shap_values": shap_result["shap_values"],
        "top_factors": shap_result["top_factors"],
        "base_value": shap_result["base_value"],
        "model_version": model_metadata[model_key]["version"],
    }


@app.post("/predict/basic", response_model=PredictionResponse)
async def predict_basic(request: BasicScreeningRequest):
    """
    Basic lifestyle screening prediction.
    Uses 11 features from Kaggle CVD dataset.
    """
    try:
        patient_array = np.array([request.to_model_array()])
        feature_names = model_metadata["basic"].get("feature_names", [])
        
        result = _make_prediction("basic", patient_array, feature_names)
        return PredictionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Basic prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/clinical", response_model=PredictionResponse)
async def predict_clinical(request: ClinicalScreeningRequest):
    """
    Clinical screening prediction.
    Uses 11 features from Heart Failure Prediction dataset.
    """
    try:
        patient_array = np.array([request.to_model_array()])
        feature_names = model_metadata["clinical"].get("feature_names", [])
        
        result = _make_prediction("clinical", patient_array, feature_names)
        return PredictionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clinical prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# =============================================================================
# GLOBAL EXCEPTION HANDLER
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle unexpected errors gracefully."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )


# =============================================================================
# RUN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)