from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import pandas as pd
import os

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Smart Medical Advisor ML API")

# Настройка CORS (чтобы Next.js мог делать запросы к API из браузера)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Разрешаем запросы с локального Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Глобальная переменная для модели
model = None

# Пытаемся загрузить модель при старте сервера
# Если файла нет (ты еще не обучил модель), сервер не упадет, 
# а просто будет готов к работе, выдавая заглушку.
MODEL_PATH = "model.pkl"
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

# Описываем, какие данные мы ждем от Next.js
class HealthMetrics(BaseModel):
    age: int
    gender: int
    weight: float
    height: int
    blood_pressure_hi: int
    blood_pressure_lo: int
    cholesterol_level: int
    glucose_level: int
    smoke: bool
    alco: bool
    active: bool

@app.get("/health")
def health_check():
    """Эндпоинт для проверки, что сервер жив (нужно для Docker)"""
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict")
def predict_risk(metrics: HealthMetrics):
    """Главный эндпоинт для предсказания риска"""
    # 1. Превращаем данные в DataFrame (формат, который понимает модель)
    input_data = pd.DataFrame([metrics.model_dump()])
    
    # Считаем BMI (Индекс массы тела), так как это важная фича для ML
    input_data['bmi'] = input_data['weight'] / ((input_data['height'] / 100) ** 2)

    # 2. Если настоящей модели пока нет, отдаем фейковый ответ (полезно для разработки фронтенда)
    if model is None:
        return {
            "risk_score": 42.5,
            "warning": "Model not loaded, returning mock data."
        }

    # 3. Делаем предсказание реальной моделью
    try:
        # predict_proba возвращает вероятности для классов [здоров, болен]
        # Мы берем вероятность класса "болен" (индекс 1) и переводим в проценты
        probability = model.predict_proba(input_data)[0][1] * 100
        
        return {
            "risk_score": round(probability, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))