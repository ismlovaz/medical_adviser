import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { DonutChart } from '@/components/ui/DonutChart';
import { ShieldAlert, Activity, ArrowLeft, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import Link from 'next/link';

export default async function ResultsPage(props: { params: Promise<{ locale: string, id: string }> }) {
    const params = await props.params;
    const { locale, id } = params;
    const t = await getTranslations({ locale, namespace: 'Results' });
    const tScreening = await getTranslations({ locale, namespace: 'Screening' });
    const tClinical = await getTranslations({ locale, namespace: 'Clinical' });

    // Fetch the prediction and session data
    const prediction = await prisma.prediction.findUnique({
        where: { id: id },
        include: { session: true }
    });

    if (!prediction || !prediction.session) {
        notFound();
    }

    const sessionData = prediction.session;
    const aiInsights = prediction.aiInsights as any; // { riskLevel, conclusion, recommendations }

    const authSession = await auth.api.getSession({
        headers: await headers()
    });
    
    // In our app, we currently require authentication to save to DB, so user is likely logged in.
    // But we'll implement the UI logic for "guest banner" anyway as requested.
    const isGuest = !authSession?.user;

    // Helper to get translated risk level
    const getRiskLabel = (level: string) => {
        if (level === 'Low') return t('lowRisk');
        if (level === 'High') return t('highRisk');
        return t('moderateRisk');
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
                            <Activity className="mr-3 h-8 w-8 text-blue-600" />
                            {t('title')}
                        </h1>
                    </div>
                </div>

                {isGuest && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center text-amber-800">
                            <User className="h-5 w-5 mr-3" />
                            <span className="font-medium text-sm">{t('guestMode')}</span>
                        </div>
                        <Link href="/register" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                            {t('registerCta')}
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Provided Data */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
                                    {t('providedData')}
                                </h2>
                                <Link href="/" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                                    {t('editData')}
                                </Link>
                            </div>
                            <div className="p-5 space-y-4">
                                <DataRow label={tScreening('ageLabel')} value={sessionData.age.toString()} />
                                <DataRow label={tScreening('genderLabel')} value={sessionData.gender === 'M' ? tScreening('male') : tScreening('female')} />
                                <DataRow label={tScreening('bpLabel')} value={`${sessionData.bloodPressureHi || '-'} / ${sessionData.bloodPressureLo || '-'}`} />
                                <DataRow label={tScreening('cholesterolLabel')} value={sessionData.cholesterolLevel?.toString() || '-'} />
                                <DataRow label={tScreening('smoking')} value={sessionData.smoke ? tScreening('yes') : tScreening('no')} />
                                
                                {sessionData.mode === 'CLINICAL' && (
                                    <>
                                        <hr className="my-4 border-slate-100" />
                                        <DataRow label={tClinical('chestPainType')} value={sessionData.chestPainType ? tClinical(`cp_${sessionData.chestPainType}`) : '-'} />
                                        <DataRow label={tClinical('maxHeartRate')} value={sessionData.maxHR?.toString() || '-'} />
                                        <DataRow label={tClinical('oldpeak')} value={sessionData.oldpeak?.toString() || '-'} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Analysis */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Clinical Conclusion Card */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm flex items-start space-x-4">
                            <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0">
                                <ShieldAlert className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900 mb-2">{t('clinicalConclusion')}</h3>
                                <p className="text-indigo-800 leading-relaxed text-sm">
                                    {aiInsights?.conclusion || "No clinical conclusion generated."}
                                </p>
                            </div>
                        </div>

                        {/* Chart & Recommendations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Chart Area */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">{t('riskLevel')}</h4>
                                <DonutChart percentage={prediction.riskScore} />
                                <div className="mt-6 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                                    <span className="text-sm font-semibold text-slate-700">
                                        {getRiskLabel(aiInsights?.riskLevel || "Moderate")}
                                    </span>
                                </div>
                            </div>

                            {/* Recommendations Area */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center">
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                    {t('recommendations')}
                                </h4>
                                <ul className="space-y-4 flex-1">
                                    {Array.isArray(aiInsights?.recommendations) ? (
                                        aiInsights.recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className="flex items-start">
                                                <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3" />
                                                <span className="text-sm text-slate-600 leading-relaxed">{rec}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-sm text-slate-500">No recommendations available.</li>
                                    )}
                                </ul>
                            </div>
                            
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function DataRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">{label}</span>
            <span className="text-slate-900 font-semibold">{value}</span>
        </div>
    );
}
