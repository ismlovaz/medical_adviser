import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { getLoginSchema, type LoginInput } from "@/lib/validations/auth";
import { useTranslations } from "next-intl";

export const useLogin = () => {
    const router = useRouter();
    const tErrors = useTranslations('Auth.Errors');
    const tValidation = useTranslations('Auth.Validation');
    const [globalError, setGlobalError] = useState<string | null>(null);

    const form = useForm<LoginInput>({
        resolver: zodResolver(getLoginSchema(tValidation)),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginInput) => {
        setGlobalError(null);

        try {
            const { error: signInError } = await signIn.email({
                email: data.email,
                password: data.password,
            });

            if (signInError) {
                if (signInError.code === "INVALID_EMAIL_OR_PASSWORD") {
                    // Подсвечиваем оба поля, но сообщение выводим только под паролем
                    form.setError("email", { type: "server", message: "" });
                    form.setError("password", { type: "server", message: tErrors("invalidCredentials") });
                } else {
                    setGlobalError(tErrors("loginFailed"));
                }
                return;
            }

            // Успешный вход -> кидаем в рабочую зону
            router.push("/dashboard");
            await new Promise(() => {}); // Кнопка останется "loading" до размонтирования страницы

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

    return {
        form,
        globalError,
        onSubmit,
        handleGoogleLogin,
        isSubmitting: form.formState.isSubmitting,
    };
};