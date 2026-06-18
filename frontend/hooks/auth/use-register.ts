import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp, signIn } from "@/lib/auth-client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export const useRegister = () => {
    const router = useRouter();
    const [globalError, setGlobalError] = useState<string | null>(null);

    const form = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const onSubmit = async (data: RegisterInput) => {
        setGlobalError(null);

        try {
            const { error: signUpError } = await signUp.email({
                name: data.name,
                email: data.email,
                password: data.password,
            });

            if (signUpError) {
                // 1. Проверяем, если ошибка связана с email (пользователь существует)
                if (signUpError.code === "USER_ALREADY_EXISTS") {
                    // Бьем ошибкой прямо в поле email
                    form.setError("email", {
                        type: "server",
                        message: "This email is already registered."
                    });
                }
                // 2. Если ошибка с паролем (например, не прошел валидацию сервера)
                else if (signUpError.code === "WEAK_PASSWORD" || signUpError.code === "INVALID_PASSWORD") {
                    form.setError("password", {
                        type: "server",
                        message: "Invalid password format from server."
                    });
                }
                // 3. Любая другая непредвиденная ошибка уходит в глобальный алерт
                else {
                    setGlobalError(signUpError.message || "Registration failed");
                }
                return;
            }

            router.push("/dashboard");
            await new Promise(() => {}); // Кнопка останется "loading", предотвращая повторное нажатие

        } catch (err) {
            setGlobalError("An unexpected error occurred. Please try again.");
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signIn.social({ provider: "google" });
        } catch (err) {
            setGlobalError("Google sign-in failed.");
        }
    };

    return { form, globalError, onSubmit, handleGoogleLogin, isSubmitting: form.formState.isSubmitting };
};