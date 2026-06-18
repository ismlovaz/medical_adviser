import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
    name: z
        .string()
        .min(1, "Full name is required")
        .min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        ),
});

// Выводим TypeScript типы напрямую из Zod-схем
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;