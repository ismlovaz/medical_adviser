'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function autofillFromText(text: string) {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    const prompt = `
Extract medical data from the following text.
Return ONLY a JSON object matching this structure:
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
  "active": boolean
}
If a field is missing from text, use these defaults:
gender: "M", age: 45, height: 175, weight: 75, bloodPressureHi: 120, bloodPressureLo: 80, cholesterolLevel: 1, glucoseLevel: 1, smoke: false, alco: false, active: true.

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