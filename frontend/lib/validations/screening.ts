import { z } from 'zod';

export const getBasicScreeningSchema = (t: (key: string) => string = (k) => k) => {
    return z.object({
        gender: z.enum(['M', 'F']).refine((val) => val === 'M' || val === 'F', {
            message: t('gender_required'),
        }),

        // Чтобы TypeScript (react-hook-form) не ругался на несовпадение типов (unknown vs number),
        // используем строго z.number().
        // В HTML мы уже используем valueAsNumber: true или кастомные инпуты, так что приходить будут числа.
        age: z.number()
            .min(18, t('age_min'))
            .max(120, t('age_max')),

        height: z.number()
            .min(100, t('height_invalid'))
            .max(250, t('height_invalid')),

        weight: z.number()
            .min(30, t('weight_invalid'))
            .max(300, t('weight_invalid')),

        bloodPressureHi: z.number()
            .min(70, t('bp_invalid'))
            .max(250, t('bp_invalid')),

        bloodPressureLo: z.number()
            .min(40, t('bp_invalid'))
            .max(150, t('bp_invalid')),

        cholesterolLevel: z.number().min(1).max(3),
        glucoseLevel: z.number().min(1).max(3),

        smoke: z.boolean(),
        alco: z.boolean(),
        active: z.boolean(),
    });
};

export type BasicScreeningFormValues = z.infer<
    ReturnType<typeof getBasicScreeningSchema>
>;

export const getAdvancedScreeningSchema = (t: (key: string) => string = (k) => k) => {
    return getBasicScreeningSchema(t).extend({
        chestPainType: z.enum(['typical_angina', 'atypical_angina', 'non_anginal', 'asymptomatic'], {
            message: t('required')
        }),
        restingECG: z.enum(['normal', 'stt_abnormality', 'lv_hypertrophy'], {
            message: t('required')
        }),
        maxHeartRate: z.number({ message: t('required') }).min(60, t('hr_min')).max(220, t('hr_max')),
        exerciseAngina: z.boolean({ message: t('required') }),
        oldpeak: z.number({ message: t('required') }).min(0, t('oldpeak_min')).max(10, t('oldpeak_max')), // typically ST depression 0-6.2
        stSlope: z.enum(['upsloping', 'flat', 'downsloping'], {
            message: t('required')
        }),
        majorVessels: z.number({ message: t('required') }).min(0, t('vessels_min')).max(3, t('vessels_max')),
        thalassemia: z.enum(['normal', 'fixed_defect', 'reversable_defect'], {
            message: t('required')
        }),
    });
};

export type AdvancedScreeningFormValues = z.infer<
    ReturnType<typeof getAdvancedScreeningSchema>
>;
