import { GoogleGenerativeAI } from "@google/generative-ai";
import { AdvancedScreeningFormValues } from "../validations/screening";

export interface AnalysisResult {
    riskPercentage: number;
    riskLevel: "Low" | "Moderate" | "High";
    conclusion: string;
    recommendations: string[];
    shapData?: any; // To store explainability factors
}

export async function analyzeRisk(
    data: AdvancedScreeningFormValues, 
    mode: 'basic' | 'clinical', 
    locale: string = 'en'
): Promise<AnalysisResult> {
    let pythonResult: any = null;

    if (process.env.USE_PYTHON_BACKEND === 'true') {
        const mlApiUrl = process.env.ML_API_URL || "http://127.0.0.1:8000";
        
        // 1. Map data to Python backend schemas
        let payload: any = {};
        if (mode === 'basic') {
            payload = {
                age: data.age,
                gender: data.gender === "F" ? 1 : 2,
                height: data.height || 170,
                weight: data.weight || 70,
                ap_hi: data.bloodPressureHi || 120,
                ap_lo: data.bloodPressureLo || 80,
                cholesterol: data.cholesterolLevel || 1,
                gluc: data.glucoseLevel || 1,
                smoke: data.smoke || false,
                alco: data.alco || false,
                active: data.active ?? true,
            };
        } else {
            const chestPainMap: Record<string, string> = {
                'typical_angina': 'TA',
                'atypical_angina': 'ATA',
                'non_anginal': 'NAP',
                'asymptomatic': 'ASY'
            };
            const ecgMap: Record<string, string> = {
                'normal': 'Normal',
                'stt_abnormality': 'ST',
                'lv_hypertrophy': 'LVH'
            };

            payload = {
                age: data.age,
                sex: data.gender === "M" ? "M" : "F",
                chest_pain_type: data.chestPainType ? chestPainMap[data.chestPainType] : "ASY",
                resting_bp: data.bloodPressureHi || 120,
                cholesterol: data.cholesterolLevel || 200, 
                fasting_bs: data.glucoseLevel && data.glucoseLevel > 120 ? true : false,
                resting_ecg: data.restingECG ? ecgMap[data.restingECG] : "Normal",
                max_hr: data.maxHeartRate || 150,
                exercise_angina: data.exerciseAngina || false,
                oldpeak: data.oldpeak || 0.0,
                st_slope: data.stSlope === "upsloping" ? "Up" : data.stSlope === "downsloping" ? "Down" : "Flat"
            };
        }

        // 2. Call FastAPI
        try {
            const response = await fetch(`${mlApiUrl}/predict/${mode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`ML backend failed: ${response.status} ${errText}`);
            }
            pythonResult = await response.json();
        } catch (error) {
            console.error("Failed to reach Python backend:", error);
            // Fallback to Gemini fully if backend is down
        }
    }

    // 3. Gemini Augmentation
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-lite-latest",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    const languageInstruction = locale === 'ko' 
        ? "CRITICAL: You MUST write the 'conclusion' and 'recommendations' entirely in professional Korean medical terminology using the formal-polite level (하십시오체)."
        : "CRITICAL: You MUST write the 'conclusion' and 'recommendations' in English using professional medical terminology.";

    let prompt = "";
    if (pythonResult) {
        prompt = `
You are an expert Cardiologist AI. 
A machine learning model has analyzed the patient data and determined the following:
- Risk Percentage: ${pythonResult.risk_percentage}%
- Top Risk Factors (SHAP analysis): ${JSON.stringify(pythonResult.top_factors, null, 2)}

Patient Raw Data:
${JSON.stringify(data, null, 2)}

${languageInstruction}

Your task is to provide the clinical conclusion and actionable recommendations based EXACTLY on the machine learning risk percentage and the top risk factors. Do not change the risk percentage.

Return ONLY a JSON object matching this structure exactly:
{
  "riskLevel": "Low" | "Moderate" | "High",
  "conclusion": string (professional clinical conclusion explaining the risk based on the top factors),
  "recommendations": [string] (array of 3-5 specific, actionable clinical recommendations)
}
`;
    } else {
        prompt = `
You are an expert Cardiologist AI. Analyze the following patient data and provide a cardiovascular risk assessment.
${languageInstruction}

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
    }

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const geminiJson = JSON.parse(responseText);

        if (pythonResult) {
            return {
                riskPercentage: pythonResult.risk_percentage,
                riskLevel: geminiJson.riskLevel || (pythonResult.risk_percentage > 50 ? "High" : "Moderate"),
                conclusion: geminiJson.conclusion,
                recommendations: geminiJson.recommendations,
                shapData: pythonResult.top_factors
            };
        } else {
            return geminiJson as AnalysisResult;
        }

    } catch (error: any) {
        console.error("Gemini Analysis Error Details:", error.message || error);
        return {
            riskPercentage: pythonResult ? pythonResult.risk_percentage : 50,
            riskLevel: "Moderate",
            conclusion: "Analysis completed with partial fallback due to AI text generation error.",
            recommendations: ["Consult a physician for proper analysis based on your risk score."],
            shapData: pythonResult ? pythonResult.top_factors : undefined
        };
    }
}
