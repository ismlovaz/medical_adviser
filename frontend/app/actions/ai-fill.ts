'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function autofillFromText(text: string) {
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-lite-latest",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    const prompt = `
Extract medical data from the following text.
Return ONLY a JSON object matching this structure. Use null for missing clinical fields.
{
  "gender": "M" or "F",
  "age": number (e.g. 45),
  "height": number (in cm, e.g. 175),
  "weight": number (in kg, e.g. 75),
  "bloodPressureHi": number (systolic, e.g. 120),
  "bloodPressureLo": number (diastolic, e.g. 80),
  "cholesterolLevel": number (1: Normal, 2: Elevated, 3: High),
  "glucoseLevel": number (1: Normal, 2: Elevated, 3: High),
  "smoke": boolean,
  "alco": boolean,
  "active": boolean,
  "chestPainType": "typical_angina" | "atypical_angina" | "non_anginal" | "asymptomatic" | null,
  "restingECG": "normal" | "stt_abnormality" | "lv_hypertrophy" | null,
  "maxHeartRate": number (e.g. 150) | null,
  "exerciseAngina": boolean | null,
  "oldpeak": number (e.g. 2.5) | null,
  "stSlope": "upsloping" | "flat" | "downsloping" | null,
  "majorVessels": number (0-3) | null,
  "thalassemia": "normal" | "fixed_defect" | "reversable_defect" | null
}
If a basic field is missing from text, use these defaults:
gender: "M", age: 45, height: 175, weight: 75, bloodPressureHi: 120, bloodPressureLo: 80, cholesterolLevel: 1, glucoseLevel: 1, smoke: false, alco: false, active: true.
If a clinical field is missing, use null.

Text: "${text}"
`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error) {
        console.error("AI Parsing Error:", error);
        return null;
    }
}