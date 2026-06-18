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
