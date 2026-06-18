import { GoogleGenerativeAI } from "@google/generative-ai";
import { AdvancedScreeningFormValues } from "../validations/screening";

export interface AnalysisResult {
    riskPercentage: number;
    riskLevel: "Low" | "Moderate" | "High";
    conclusion: string;
    recommendations: string[];
}

export async function analyzeRisk(data: AdvancedScreeningFormValues, locale: string = 'en'): Promise<AnalysisResult> {
    if (process.env.USE_PYTHON_BACKEND === 'true') {
        // --- PYTHON BACKEND (Future implementation) ---
        // Here we will call the FastAPI endpoint running our trained ML model
        //
        // const response = await fetch('http://localhost:8000/api/predict', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ ...data, locale })
        // });
        // if (!response.ok) throw new Error("ML backend failed");
        // return await response.json() as AnalysisResult;
        
        throw new Error("Python backend is not yet implemented. Set USE_PYTHON_BACKEND=false to use Gemini.");
    } else {
        // --- GEMINI MOCK BACKEND (Temporary) ---
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const languageInstruction = locale === 'ko' 
            ? "CRITICAL: You MUST write the 'conclusion' and 'recommendations' entirely in professional Korean medical terminology using the formal-polite level (하십시오체)."
            : "CRITICAL: You MUST write the 'conclusion' and 'recommendations' in English using professional medical terminology.";

        const prompt = `
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

        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            try {
                return JSON.parse(responseText) as AnalysisResult;
            } catch (parseError) {
                console.error("Gemini JSON Parse Error. Raw response:", responseText);
                throw parseError;
            }
        } catch (error: any) {
            console.error("Gemini Analysis Error Details:");
            console.error(error.message || error);
            // Fallback in case of API failure
            return {
                riskPercentage: 50,
                riskLevel: "Moderate",
                conclusion: "Analysis failed due to API error. Manual review required.",
                recommendations: ["Consult a physician immediately for proper analysis."]
            };
        }
    }
}
