import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // trying 1.5
    generationConfig: {
        responseMimeType: "application/json"
    }
});

async function run() {
    try {
        const result = await model.generateContent("Respond with { \"test\": true }");
        console.log(result.response.text());
    } catch (e) {
        console.error(e);
    }
}
run();
