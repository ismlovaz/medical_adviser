'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { useSession } from '@/lib/auth-client';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { getBasicScreeningSchema, BasicScreeningFormValues } from '@/lib/validations/screening';
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync';
import { autofillFromText } from '@/app/actions/ai-fill';
import { Step1Physiology } from './basic/Step1Physiology';
import { Step2Lifestyle } from './basic/Step2Lifestyle';

export function ScreeningForm() {
    const router = useRouter();
    const t = useTranslations("Screening");
    const tVal = useTranslations("Auth.Validation");
    const [activeTab, setActiveTab] = useState<'basic' | 'clinical'>('basic');
    const [step, setStep] = useState(1);
    const [notes, setNotes] = useState("");
    const [isAutofilling, setIsAutofilling] = useState(false);
    const { data: session } = useSession();

    const methods = useForm<BasicScreeningFormValues>({
        resolver: zodResolver(getBasicScreeningSchema(tVal)),
        defaultValues: {
            gender: 'M', age: 45, height: 175, weight: 75,
            bloodPressureHi: 120, bloodPressureLo: 80,
            cholesterolLevel: 1, glucoseLevel: 1,
            smoke: false, alco: false, active: true
        },
        mode: 'onChange'
    });

    const { saveToStorage } = useLocalStorageSync(methods);

    const handleNext = async () => {
        const isValid = await methods.trigger(['gender', 'age', 'height', 'weight', 'bloodPressureHi', 'bloodPressureLo']);
        if (isValid) setStep(2);
    };

    const handleAutofill = async () => {
        if (!notes.trim()) return;
        setIsAutofilling(true);
        toast.loading(t("toastParsing"));
        try {
            const data = await autofillFromText(notes);
            if (data) {
                methods.reset(data);
                toast.success(t("toastSuccess"));
            }
        } catch (e) {
            toast.error(t("toastFailed"));
        } finally {
            setIsAutofilling(false);
            toast.dismiss();
        }
    };

    const onSubmit = async (data: BasicScreeningFormValues) => {
        if (!session) {
            saveToStorage(data);
            toast.error(t("toastLoginRequired"));
            router.push("/login?callbackUrl=/");
            return;
        }
        toast.success(t("toastAnalysisStarted", { type: activeTab === 'basic' ? t('basicTab') : t('clinicalTab') }));
    };

    return (
        <FormProvider {...methods}>
            <Toaster position="top-right" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                {/* Left: AI Autofill */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="flex items-center text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">
                            <Sparkles size={16} className="mr-2" /> {t("clinicalNotes")}
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t("notesPlaceholder")}
                            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            onClick={handleAutofill}
                            disabled={isAutofilling}
                            className="w-full mt-4 flex justify-center items-center px-4 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all"
                        >
                            {isAutofilling ? t("autofillProcessing") : t("autofillBtn")}
                        </button>
                    </div>
                </div>

                {/* Right: The Form with Tabs */}
                <form onSubmit={methods.handleSubmit(onSubmit)} className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">

                    {/* Header Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button type="button" onClick={() => setActiveTab('basic')} className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'basic' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>{t("basicTab")}</button>
                        <button type="button" onClick={() => setActiveTab('clinical')} className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'clinical' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>{t("clinicalTab")}</button>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                        
                        {/* Stepper info */}
                        {activeTab === 'basic' && (
                            <div className="mb-6 flex justify-between items-center text-sm font-medium text-slate-500">
                                <span>{t("stepOf", { step })} {step === 1 ? t("step1Title") : t("step2Title")}</span>
                            </div>
                        )}

                        <div className="relative flex-1">
                            {/* Здесь логика переключения контента */}
                            {activeTab === 'basic' ? (
                                step === 1 ? <Step1Physiology /> : <Step2Lifestyle />
                            ) : (
                                <div className="text-center py-20 text-slate-400">{t("clinicalComingSoon")}</div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
                            {activeTab === 'basic' && step === 2 ? (
                                <>
                                    <button type="button" onClick={() => setStep(1)} className="text-slate-500 font-medium flex items-center"><ArrowLeft className="mr-2" size={16} /> {t("btnBack")}</button>
                                    <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl shadow-sm font-semibold flex items-center"><Sparkles className="mr-2" size={16} /> {t("btnRun")}</button>
                                </>
                            ) : activeTab === 'basic' ? (
                                <button type="button" onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white py-3 rounded-xl font-semibold flex justify-center items-center">{t("btnNext")} <ArrowRight className="ml-2" size={16} /></button>
                            ) : null}
                        </div>
                    </div>
                </form>
            </div>
        </FormProvider>
    );
}