'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { useSession } from '@/lib/auth-client';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { getAdvancedScreeningSchema, getBasicScreeningSchema, AdvancedScreeningFormValues } from '@/lib/validations/screening';
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync';
import { autofillFromText } from '@/app/actions/ai-fill';
import { Step1Physiology } from './basic/Step1Physiology';
import { Step2Lifestyle } from './basic/Step2Lifestyle';
import { ClinicalPanel } from '../clinical/ClinicalPanel';

export function ScreeningForm() {
    const router = useRouter();
    const t = useTranslations("Screening");
    const tVal = useTranslations("Auth.Validation");
    const locale = useLocale();
    const [activeTab, setActiveTab] = useState<'basic' | 'clinical'>('basic');
    const [currentStep, setCurrentStep] = useState(1);
    const [notes, setNotes] = useState("");
    const [isAutofilling, setIsAutofilling] = useState(false);
    const { data: session } = useSession();

    const resolver: Resolver<AdvancedScreeningFormValues> = (data: any, context: any, options: any) => {
        const schema = activeTab === 'clinical' 
            ? getAdvancedScreeningSchema(tVal) 
            : getBasicScreeningSchema(tVal);
        return zodResolver(schema)(data, context, options) as any;
    };

    const methods = useForm<AdvancedScreeningFormValues>({
        resolver,
        defaultValues: {
            gender: 'M', age: 45, height: 175, weight: 75,
            bloodPressureHi: 120, bloodPressureLo: 80,
            cholesterolLevel: 1, glucoseLevel: 1,
            smoke: false, alco: false, active: true,
            chestPainType: null as any, restingECG: null as any, maxHeartRate: null as any,
            exerciseAngina: null as any, oldpeak: null as any, stSlope: null as any,
            majorVessels: null as any, thalassemia: null as any,
        },
        mode: 'onChange'
    });

    const { saveToStorage } = useLocalStorageSync(methods);

    const totalSteps = activeTab === 'basic' ? 2 : 5;

    // Reset current step if switching tabs causes it to overflow
    useEffect(() => {
        if (currentStep > totalSteps) {
            setCurrentStep(totalSteps);
        }
    }, [activeTab, totalSteps, currentStep]);

    const handleNext = async () => {
        let fieldsToValidate: any[] = [];
        
        if (currentStep === 1) fieldsToValidate = ['gender', 'age', 'height', 'weight', 'bloodPressureHi', 'bloodPressureLo'];
        else if (currentStep === 2) fieldsToValidate = ['cholesterolLevel', 'glucoseLevel', 'smoke', 'alco', 'active'];
        else if (currentStep === 3) fieldsToValidate = ['chestPainType', 'exerciseAngina'];
        else if (currentStep === 4) fieldsToValidate = ['restingECG', 'maxHeartRate', 'oldpeak', 'stSlope'];
        // step 5 doesn't have a Next button
        
        const isValid = await methods.trigger(fieldsToValidate);
        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const onError = (errors: any) => {
        const step1Fields = ['gender', 'age', 'height', 'weight', 'bloodPressureHi', 'bloodPressureLo'];
        const step2Fields = ['cholesterolLevel', 'glucoseLevel', 'smoke', 'alco', 'active'];
        const step3Fields = ['chestPainType', 'exerciseAngina'];
        const step4Fields = ['restingECG', 'maxHeartRate', 'oldpeak', 'stSlope'];
        const step5Fields = ['majorVessels', 'thalassemia'];

        const errorFields = Object.keys(errors);
        
        if (errorFields.some(f => step1Fields.includes(f))) {
            setCurrentStep(1);
        } else if (errorFields.some(f => step2Fields.includes(f))) {
            setCurrentStep(2);
        } else if (activeTab === 'clinical') {
            if (errorFields.some(f => step3Fields.includes(f))) {
                setCurrentStep(3);
            } else if (errorFields.some(f => step4Fields.includes(f))) {
                setCurrentStep(4);
            } else if (errorFields.some(f => step5Fields.includes(f))) {
                setCurrentStep(5);
            }
        }
    };

    const handleAutofill = async () => {
        if (!notes.trim()) return;
        setIsAutofilling(true);
        toast.loading(t("toastParsing"));
        try {
            const data = await autofillFromText(notes);
            if (data) {
                methods.reset(data);
                
                // Switch to clinical tab automatically if advanced fields were detected
                if (data.chestPainType !== null || data.restingECG !== null || data.maxHeartRate !== null || data.oldpeak !== null || data.stSlope !== null || data.majorVessels !== null || data.thalassemia !== null) {
                    setActiveTab('clinical');
                }
                
                toast.success(t("toastSuccess"));
            }
        } catch (e) {
            toast.error(t("toastFailed"));
        } finally {
            setIsAutofilling(false);
            toast.dismiss();
        }
    };

    const onSubmit = async (data: AdvancedScreeningFormValues) => {
        if (!session) {
            saveToStorage(data);
            toast.error(t("toastLoginRequired"));
            router.push("/login?callbackUrl=/");
            return;
        }

        const loadingToast = toast.loading(t("toastAnalysisStarted", { type: activeTab === 'basic' ? t('basicTab') : t('clinicalTab') }));
        
        try {
            const { submitScreening } = await import('@/app/actions/submit-screening');
            const result = await submitScreening(data, activeTab, locale);
            
            if (result.success && result.predictionId) {
                toast.success("Analysis complete!", { id: loadingToast });
                router.push(`/results/${result.predictionId}`);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to analyze data", { id: loadingToast });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            if (currentStep < totalSteps) {
                handleNext();
            } else {
                methods.handleSubmit(onSubmit, onError)();
            }
        }
    };

    const getStepTitle = () => {
        if (currentStep === 1) return t("step1Title");
        if (currentStep === 2) return t("step2Title");
        if (currentStep === 3) return "Symptomatology";
        if (currentStep === 4) return "ECG & Stress Test";
        if (currentStep === 5) return "Angiography & Scans";
        return "";
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
                            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={handleAutofill}
                            disabled={isAutofilling}
                            className="w-full mt-4 flex justify-center items-center px-4 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all"
                        >
                            {isAutofilling ? t("autofillProcessing") : t("autofillBtn")}
                        </button>
                    </div>
                </div>

                {/* Right: The Form with Tabs */}
                <form 
                    onSubmit={(e) => e.preventDefault()} 
                    onKeyDown={handleKeyDown}
                    className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]"
                >

                    {/* Header Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button type="button" onClick={() => { setActiveTab('basic'); setCurrentStep(1); }} className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'basic' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>{t("basicTab")}</button>
                        <button type="button" onClick={() => { setActiveTab('clinical'); setCurrentStep(1); }} className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'clinical' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>{t("clinicalTab")}</button>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                        
                        {/* Stepper info */}
                        <div className="mb-6 flex justify-between items-center text-sm font-medium text-slate-500">
                            <span>Step {currentStep} of {totalSteps}: {getStepTitle()}</span>
                        </div>

                        <div className="relative flex-1">
                            {currentStep === 1 && <Step1Physiology />}
                            {currentStep === 2 && <Step2Lifestyle />}
                            {currentStep === 3 && <ClinicalPanel step={1} />}
                            {currentStep === 4 && <ClinicalPanel step={2} />}
                            {currentStep === 5 && <ClinicalPanel step={3} />}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
                            {currentStep > 1 && (
                                <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="text-slate-500 font-medium flex items-center mr-4">
                                    <ArrowLeft className="mr-2" size={16} /> {t("btnBack")}
                                </button>
                            )}
                            
                            {currentStep === totalSteps ? (
                                <button type="button" onClick={methods.handleSubmit(onSubmit, onError)} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl shadow-sm font-semibold flex justify-center items-center">
                                    <Sparkles className="mr-2" size={16} /> {t("btnRun")}
                                </button>
                            ) : (
                                <button type="button" onClick={handleNext} className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors text-white py-3 rounded-xl font-semibold flex justify-center items-center">
                                    {t("btnNext")} <ArrowRight className="ml-2" size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </FormProvider>
    );
}
