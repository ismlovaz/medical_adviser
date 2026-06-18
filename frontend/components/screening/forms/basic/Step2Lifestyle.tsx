import { useFormContext } from 'react-hook-form';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BasicScreeningFormValues } from '@/lib/validations/screening';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';

export function Step2Lifestyle() {
    const { control, watch, setValue } = useFormContext<BasicScreeningFormValues>();
    const t = useTranslations("Screening");

    const levelOptions = [
        { label: t("levelNormal"), value: 1 },
        { label: t("levelElevated"), value: 2 },
        { label: t("levelHigh"), value: 3 }
    ];

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <SegmentedControl name="cholesterolLevel" control={control} label={t("cholesterolLabel")} options={levelOptions} />
                <SegmentedControl name="glucoseLevel" control={control} label={t("glucoseLabel")} options={levelOptions} />
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-700">{t("lifestyleTitle")}</h4>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">

                    <div className="flex items-center justify-between p-4">
                        <span className="text-sm font-medium text-slate-700">{t("smoking")}</span>
                        <Switch checked={watch('smoke')} onCheckedChange={(val) => setValue('smoke', val)} />
                    </div>

                    <div className="flex items-center justify-between p-4">
                        <span className="text-sm font-medium text-slate-700">{t("alcohol")}</span>
                        <Switch checked={watch('alco')} onCheckedChange={(val) => setValue('alco', val)} />
                    </div>

                    <div className="flex items-center justify-between p-4">
                        <span className="text-sm font-medium text-slate-700">{t("activity")}</span>
                        <Switch checked={watch('active')} onCheckedChange={(val) => setValue('active', val)} />
                    </div>

                </div>
            </div>
        </div>
    );
}