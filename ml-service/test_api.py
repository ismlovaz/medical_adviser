import httpx
import json

base_url = "http://127.0.0.1:8000"

print("--- Testing Basic Model ---")
basic_payload = {
    "age": 65,
    "gender": 2,
    "height": 165,
    "weight": 100,
    "ap_hi": 160,
    "ap_lo": 100,
    "cholesterol": 3,
    "gluc": 3,
    "smoke": True,
    "alco": True,
    "active": False
}
with httpx.Client() as client:
    r1 = client.post(f"{base_url}/predict/basic", json=basic_payload)
    print("Status Code:", r1.status_code)
    if r1.status_code == 200:
        print(json.dumps(r1.json(), indent=2, ensure_ascii=False))
    else:
        print(r1.text)


print("\n--- Testing Clinical Model ---")
clinical_payload = {
    "age": 55,
    "sex": "M",
    "chest_pain_type": "ASY",
    "resting_bp": 140,
    "cholesterol": 289,
    "fasting_bs": False,
    "resting_ecg": "Normal",
    "max_hr": 122,
    "exercise_angina": True,
    "oldpeak": 1.5,
    "st_slope": "Flat"
}
with httpx.Client() as client:
    r2 = client.post(f"{base_url}/predict/clinical", json=clinical_payload)
    print("Status Code:", r2.status_code)
    if r2.status_code == 200:
        print(json.dumps(r2.json(), indent=2, ensure_ascii=False))
    else:
        print(r2.text)

