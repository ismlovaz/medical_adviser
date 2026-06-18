import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp, signIn } from "@/lib/auth-client";
import { getRegisterSchema, type RegisterInput } from "@/lib/validations/auth";
import { useTranslations } from "next-intl";

export const useRegister = () => {
    const router = useRouter();
    const tErrors = useTranslations('Auth.Errors');
    const tValidation = useTranslations('Auth.Validation');
    const [globalError, setGlobalError] = useState<string | null>(null);

    const form = useForm<RegisterInput>({
        resolver: zodResolver(getRegisterSchema(tValidation)),
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
                    form.setError("email", { type: "server", message: tErrors("emailTaken") });
                } else if (signUpError.code === "WEAK_PASSWORD") {
                    form.setError("password", { type: "server", message: tErrors("weakPassword") });
                } else {
                    setGlobalError(tErrors("registrationFailed"));
                }
                return;
            }

            // Успешная регистрация -> кидаем в рабочую зону или обратно
            const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";
            router.push(callbackUrl);
            await new Promise(() => {}); // Оставляем кнопку в состоянии "loading"

        } catch (err) {
            setGlobalError(tErrors("unexpectedError"));
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signIn.social({ provider: "google" });
        } catch (err) {
            setGlobalError(tErrors("googleFailed"));
        }
    };

    return { form, globalError, onSubmit, handleGoogleLogin, isSubmitting: form.formState.isSubmitting };
};