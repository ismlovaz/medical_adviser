import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

async function run() {
    const data = {
        gender: "M",
        age: 45,
        height: 175,
        weight: 75,
        bloodPressureHi: 120,
        bloodPressureLo: 80,
        cholesterolLevel: 1,
        glucoseLevel: 1,
        smoke: false,
        alco: false,
        active: true
    };
    
    const prompt = `
You are an expert Cardiologist AI. Analyze the following patient data and provide a cardiovascular risk assessment.
CRITICAL: You MUST write the 'conclusion' and 'recommendations' entirely in professional Korean medical terminology using the formal-polite level (하십시오체).

Patient Data:
${JSON.stringify(data, null, 2)}

Return ONLY a JSON object matching this structure exactly:
{
  "riskPercentage": number (0-100),
  "riskLevel": "Low" | "Moderate" | "High",
  "conclusion": string (a short, professional clinical conclusion based on the data),
  "recommendations": [string] (an array of 3-5 specific, actionable clinical recommendations)
}
`;

    try {
        const result = await model.generateContent(prompt);
        console.log("Raw Response:");
        console.log(result.response.text());
        JSON.parse(result.response.text());
        console.log("Parsed OK!");
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
