import { z } from "zod";

export const getLoginSchema = (t: any) => z.object({
    email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
    password: z
        .string()
        .min(1, t("passwordRequired"))
        .min(8, t("passwordMin8")),
});

export const getRegisterSchema = (t: any) => z.object({
    name: z
        .string()
        .min(1, t("nameRequired"))
        .min(2, t("nameMin2")),
    email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
    password: z
        .string()
        .min(1, t("passwordRequired"))
        .min(8, t("passwordMin8"))
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            t("passwordRegex")
        ),
});

// Выводим TypeScript типы из базовых типов (чтобы не дублировать, можем использовать ReturnType)
export type LoginInput = z.infer<ReturnType<typeof getLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof getRegisterSchema>>;