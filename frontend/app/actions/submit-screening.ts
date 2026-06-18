'use server'

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { analyzeRisk } from '@/lib/services/analyzer';
import { AdvancedScreeningFormValues } from '@/lib/validations/screening';
import { redirect } from 'next/navigation';

export async function submitScreening(
    data: AdvancedScreeningFormValues, 
    mode: 'basic' | 'clinical',
    locale: string = 'en'
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("Unauthorized: Please log in to save and run diagnostics.");
    }

    // 1. Analyze risk using the Abstract Analyzer (Gemini/Python)
    const analysis = await analyzeRisk(data, mode, locale);

    // 2. Save Session Data to DB
    const healthSession = await prisma.healthSession.create({
        data: {
            userId: userId,
            mode: mode.toUpperCase(),
            
            // Common
            age: data.age,
            gender: data.gender,
            
            // Basic
            height: data.height,
            weight: data.weight,
            bloodPressureHi: data.bloodPressureHi,
            bloodPressureLo: data.bloodPressureLo,
            cholesterolLevel: data.cholesterolLevel,
            glucoseLevel: data.glucoseLevel,
            smoke: data.smoke,
            alco: data.alco,
            active: data.active,

            // Clinical
            chestPainType: data.chestPainType,
            restingECG: data.restingECG,
            maxHR: data.maxHeartRate,
            exerciseAngina: data.exerciseAngina,
            oldpeak: data.oldpeak,
            stSlope: data.stSlope,
            majorVessels: data.majorVessels,
            thalassemia: data.thalassemia,
        }
    });

    // 3. Save Prediction Result
    const prediction = await prisma.prediction.create({
        data: {
            sessionId: healthSession.id,
            riskScore: analysis.riskPercentage,
            aiInsights: {
                riskLevel: analysis.riskLevel,
                conclusion: analysis.conclusion,
                recommendations: analysis.recommendations,
                shapData: analysis.shapData || null
            }
        }
    });

    // 4. Redirect to the results page
    // Note: We'll redirect from the client side because server action redirects sometimes get tricky inside try-catch.
    // Or we can return the id and redirect via useRouter in the component.
    return { success: true, predictionId: prediction.id };
}
