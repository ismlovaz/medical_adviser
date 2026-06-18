"use client";

import { useRegister } from "@/hooks/auth/use-register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAlert, AuthDivider, GoogleSignInButton } from "@/components/auth/auth-ui";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function RegisterForm() {
    const t = useTranslations('Auth.Form');
    const tRegister = useTranslations('Auth.Register');

    const {
        form: { register, formState: { errors }, handleSubmit },
        globalError,
        onSubmit,
        handleGoogleLogin,
        isSubmitting
    } = useRegister();

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Поле: Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>
                        {t("nameLabel")}
                    </Label>
                    <Input
                        id="name"
                        placeholder={t("namePlaceholder")}
                        className={`focus-visible:ring-blue-600 ${errors.name ? "border-red-500" : ""}`}
                        disabled={isSubmitting}
                        {...register("name")}
                    />
                    {errors.name && (
                        <p className="text-sm font-medium text-red-500">{errors.name.message}</p>
                    )}
                </div>

                {/* Поле: Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>
                        {t("emailLabel")}
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        className={`focus-visible:ring-blue-600 ${errors.email ? "border-red-500" : ""}`}
                        disabled={isSubmitting}
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-sm font-medium text-red-500">{errors.email.message}</p>
                    )}
                </div>

                {/* Поле: Password */}
                <div className="space-y-2">
                    <Label htmlFor="password" className={errors.password ? "text-red-500" : ""}>
                        {t("passwordLabel")}
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder={t("passwordPlaceholder")}
                        className={`focus-visible:ring-blue-600 ${errors.password ? "border-red-500" : ""}`}
                        disabled={isSubmitting}
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className="text-sm font-medium text-red-500">{errors.password.message}</p>
                    )}
                </div>

                {/* Глобальная ошибка от сервера (Better Auth) */}
                {globalError && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{globalError}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full hover:cursor-pointer bg-[#1d4ed8] text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm transition-all duration-200"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? tRegister("submitButtonLoading") : tRegister("submitButton")}
                </Button>
            </form>

            <AuthDivider />
            <GoogleSignInButton onClick={handleGoogleLogin} isLoading={isSubmitting} />
        </div>
    );
}