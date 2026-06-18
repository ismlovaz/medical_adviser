"""
Pydantic v2 schemas for Smart Medical Advisor API.
Strict validation with Field constraints.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Literal


class BasicScreeningRequest(BaseModel):
    """Basic lifestyle screening - 11 features from Kaggle CVD dataset (70K rows)."""
    
    age: int = Field(..., ge=18, le=120, description="Age in years")
    gender: Literal[1, 2] = Field(..., description="1 = Female, 2 = Male")
    height: int = Field(..., ge=100, le=250, description="Height in cm")
    weight: float = Field(..., ge=20, le=300, description="Weight in kg")
    ap_hi: int = Field(..., ge=50, le=300, description="Systolic blood pressure")
    ap_lo: int = Field(..., ge=30, le=200, description="Diastolic blood pressure")
    cholesterol: Literal[1, 2, 3] = Field(..., description="1=normal, 2=above normal, 3=well above normal")
    gluc: Literal[1, 2, 3] = Field(..., description="1=normal, 2=above normal, 3=well above normal")
    smoke: bool = Field(..., description="Smoking status")
    alco: bool = Field(..., description="Alcohol intake")
    active: bool = Field(..., description="Physical activity")
    
    @field_validator("ap_lo")
    @classmethod
    def validate_bp(cls, v: int, info) -> int:
        values = info.data
        if "ap_hi" in values and v >= values["ap_hi"]:
            raise ValueError("Diastolic pressure must be lower than systolic")
        return v
    
    @property
    def bmi(self) -> float:
        """Calculate BMI from height and weight."""
        return self.weight / ((self.height / 100) ** 2)
    
    def to_model_array(self) -> list:
        """Convert to feature array for ML model."""
        return [
            self.age,
            self.gender,
            self.height,
            self.weight,
            self.ap_hi,
            self.ap_lo,
            self.cholesterol,
            self.gluc,
            int(self.smoke),
            int(self.alco),
            int(self.active),
        ]


class ClinicalScreeningRequest(BaseModel):
    """Clinical screening - 11 features from Heart Failure Prediction dataset (918 rows).
    
    Note: This is a SEPARATE model with different features, not an extension of Basic.
    """
    
    age: int = Field(..., ge=18, le=120, description="Age in years")
    sex: Literal["M", "F"] = Field(..., description="M = Male, F = Female")
    chest_pain_type: Literal["ATA", "NAP", "ASY", "TA"] = Field(..., description="TA=Typical Angina, ATA=Atypical, NAP=Non-Anginal, ASY=Asymptomatic")
    resting_bp: int = Field(..., ge=50, le=300, description="Resting blood pressure in mm Hg")
    cholesterol: float = Field(..., ge=0, le=700, description="Serum cholesterol in mg/dl")
    fasting_bs: bool = Field(..., description="Fasting blood sugar > 120 mg/dl")
    resting_ecg: Literal["Normal", "ST", "LVH"] = Field(..., description="Normal, ST-T abnormality, LV hypertrophy")
    max_hr: int = Field(..., ge=60, le=220, description="Maximum heart rate achieved")
    exercise_angina: bool = Field(..., description="Exercise-induced angina")
    oldpeak: float = Field(..., ge=-10, le=10, description="ST depression induced by exercise")
    st_slope: Literal["Up", "Flat", "Down"] = Field(..., description="Slope of peak exercise ST segment")
    
    @field_validator("resting_bp")
    @classmethod
    def validate_bp_positive(cls, v: int) -> int:
        if v == 0:
            raise ValueError("Resting BP cannot be 0")
        return v
    
    def to_model_array(self) -> list:
        """Convert to feature array for ML model with encoding."""
        sex_encoded = 1 if self.sex == "M" else 0
        
        chest_pain_map = {"TA": 0, "ATA": 1, "NAP": 2, "ASY": 3}
        chest_pain_encoded = chest_pain_map[self.chest_pain_type]
        
        ecg_map = {"Normal": 0, "ST": 1, "LVH": 2}
        ecg_encoded = ecg_map[self.resting_ecg]
        
        slope_map = {"Up": 0, "Flat": 1, "Down": 2}
        slope_encoded = slope_map[self.st_slope]
        
        return [
            self.age,
            sex_encoded,
            chest_pain_encoded,
            self.resting_bp,
            self.cholesterol,
            int(self.fasting_bs),
            ecg_encoded,
            self.max_hr,
            int(self.exercise_angina),
            self.oldpeak,
            slope_encoded,
        ]


class PredictionResponse(BaseModel):
    """Unified response for both modes."""
    
    risk_score: float = Field(..., ge=0, le=1, description="Calibrated probability of cardiovascular disease")
    risk_percentage: float = Field(..., ge=0, le=100, description="Risk score as percentage")
    mode: Literal["basic", "clinical"] = Field(...)
    shap_values: dict = Field(..., description="SHAP feature contributions")
    top_factors: list = Field(..., description="Top 5 risk factors with direction")
    base_value: float = Field(..., description="SHAP expected value (baseline risk)")
    model_version: str = Field(..., description="Model version used")
    
    
class HealthCheckResponse(BaseModel):
    status: str
    models_loaded: dict