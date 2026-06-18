"use client";

import { useFormContext } from "react-hook-form";
import { AdvancedScreeningFormValues } from "@/lib/validations/screening";
import { useTranslations } from "next-intl";
import { Activity, HeartPulse, Stethoscope } from "lucide-react";

export function ClinicalPanel({ step }: { step: number }) {
    const { register, formState: { errors } } = useFormContext<AdvancedScreeningFormValues>();
    const t = useTranslations("Clinical");

    const parseNumber = (v: any) => {
        if (v === "" || v == null || Number.isNaN(Number(v))) return null;
        return Number(v);
    };

    return (
        <div className="space-y-8 duration-500">
            {/* Symptomatology Card */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-slate-800">{t('groupSymptomatology')}</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('chestPainType')}</label>
                            <select 
                                {...register("chestPainType", { setValueAs: v => v === "" || v === null ? null : v })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700"
                            >
                                <option value="">--</option>
                                <option value="typical_angina">{t('cp_typical_angina')}</option>
                                <option value="atypical_angina">{t('cp_atypical_angina')}</option>
                                <option value="non_anginal">{t('cp_non_anginal')}</option>
                                <option value="asymptomatic">{t('cp_asymptomatic')}</option>
                            </select>
                            {errors.chestPainType && <p className="text-red-500 text-xs mt-1">{errors.chestPainType.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('exerciseAngina')}</label>
                            <select 
                                {...register("exerciseAngina", { 
                                    setValueAs: (v) => (v === "" || v === null) ? null : v === "true" 
                                })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700"
                            >
                                <option value="">--</option>
                                <option value="true">{t('yes')}</option>
                                <option value="false">{t('no')}</option>
                            </select>
                            {errors.exerciseAngina && <p className="text-red-500 text-xs mt-1">{errors.exerciseAngina.message}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* ECG & Stress Test Card */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                        <HeartPulse className="h-5 w-5 text-rose-500" />
                        <h3 className="font-semibold text-slate-800">{t('groupEcgStress')}</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('restingECG')}</label>
                            <select 
                                {...register("restingECG", { setValueAs: v => v === "" || v === null ? null : v })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700"
                            >
                                <option value="">--</option>
                                <option value="normal">{t('ecg_normal')}</option>
                                <option value="stt_abnormality">{t('ecg_stt_abnormality')}</option>
                                <option value="lv_hypertrophy">{t('ecg_lv_hypertrophy')}</option>
                            </select>
                            {errors.restingECG && <p className="text-red-500 text-xs mt-1">{errors.restingECG.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('maxHeartRate')}</label>
                            <input 
                                type="number"
                                {...register("maxHeartRate", { setValueAs: parseNumber })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700"
                                placeholder="e.g. 150"
                            />
                            {errors.maxHeartRate && <p className="text-red-500 text-xs mt-1">{errors.maxHeartRate.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('oldpeak')}</label>
                            <input 
                                type="number"
                                step="0.1"
                                {...register("oldpeak", { setValueAs: parseNumber })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700"
                                placeholder="0.0"
                            />
                            {errors.oldpeak && <p className="text-red-500 text-xs mt-1">{errors.oldpeak.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('stSlope')}</label>
                            <select 
                                {...register("stSlope", { setValueAs: v => v === "" || v === null ? null : v })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700"
                            >
                                <option value="">--</option>
                                <option value="upsloping">{t('slope_upsloping')}</option>
                                <option value="flat">{t('slope_flat')}</option>
                                <option value="downsloping">{t('slope_downsloping')}</option>
                            </select>
                            {errors.stSlope && <p className="text-red-500 text-xs mt-1">{errors.stSlope.message}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Angiography & Blood */}
            {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                        <Stethoscope className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-semibold text-slate-800">{t('groupAngiography')}</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('majorVessels')}</label>
                            <input 
                                type="number"
                                min="0"
                                max="3"
                                {...register("majorVessels", { setValueAs: parseNumber })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700"
                                placeholder="0-3"
                            />
                            {errors.majorVessels && <p className="text-red-500 text-xs mt-1">{errors.majorVessels.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('thalassemia')}</label>
                            <select 
                                {...register("thalassemia", { setValueAs: v => v === "" || v === null ? null : v })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700"
                            >
                                <option value="">--</option>
                                <option value="normal">{t('thal_normal')}</option>
                                <option value="fixed_defect">{t('thal_fixed_defect')}</option>
                                <option value="reversable_defect">{t('thal_reversable_defect')}</option>
                            </select>
                            {errors.thalassemia && <p className="text-red-500 text-xs mt-1">{errors.thalassemia.message}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
