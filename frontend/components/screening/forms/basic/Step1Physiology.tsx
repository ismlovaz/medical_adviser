import { useFormContext } from 'react-hook-form';
import { CounterInput } from '@/components/ui/CounterInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BasicScreeningFormValues } from '@/lib/validations/screening';
import { useTranslations } from 'next-intl';

export function Step1Physiology() {
    const { control, register, formState: { errors } } = useFormContext<BasicScreeningFormValues>();
    const t = useTranslations("Screening");
    const tVal = useTranslations("Auth.Validation");

    return (
        <div className="space-y-6">
            <SegmentedControl
                name="gender"
                control={control}
                label={t("genderLabel")}
                options={[
                    { label: t("male"), value: 'M' },
                    { label: t("female"), value: 'F' }
                ]}
            />

            <CounterInput name="age" control={control} label={t("ageLabel")} unit="yrs" min={18} max={120} />

            <div className="grid grid-cols-2 gap-4">
                <CounterInput name="height" control={control} label={t("heightLabel")} unit="cm" min={100} max={250} />
                <CounterInput name="weight" control={control} label={t("weightLabel")} unit="kg" min={30} max={300} />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t("bpLabel")}</label>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <input
                            {...register('bloodPressureHi', { valueAsNumber: true })}
                            type="number"
                            placeholder="120"
                            className="w-full p-4 pt-6 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <span className="absolute top-2 left-4 text-xs text-slate-400 font-medium">{t("systolic")}</span>
                    </div>
                    <div className="relative">
                        <input
                            {...register('bloodPressureLo', { valueAsNumber: true })}
                            type="number"
                            placeholder="80"
                            className="w-full p-4 pt-6 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <span className="absolute top-2 left-4 text-xs text-slate-400 font-medium">{t("diastolic")}</span>
                    </div>
                </div>
                {(errors.bloodPressureHi || errors.bloodPressureLo) && (
                    <p className="text-red-500 text-xs">{tVal("bp_error")}</p>
                )}
            </div>
        </div>
    );
}