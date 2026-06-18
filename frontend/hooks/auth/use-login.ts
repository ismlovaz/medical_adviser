import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export const useLogin = () => {
    const router = useRouter();
    const [globalError, setGlobalError] = useState<string | null>(null);

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
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
                    form.setError("password", { type: "server", message: "Invalid email or password." });
                } else {
                    setGlobalError(signInError.message || "Login failed");
                }
                return;
            }

            // Успешный вход -> кидаем в рабочую зону
            router.push("/dashboard");
            await new Promise(() => {}); // Кнопка останется "loading" до размонтирования страницы

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

    return {
        form,
        globalError,
        onSubmit,
        handleGoogleLogin,
        isSubmitting: form.formState.isSubmitting,
    };
};