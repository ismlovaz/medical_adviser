"use client";

import { useLogin } from "@/hooks/auth/use-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAlert, AuthDivider, GoogleSignInButton } from "@/components/auth/auth-ui";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
    const {
        form: { register, formState: { errors }, handleSubmit },
        globalError,
        onSubmit,
        handleGoogleLogin,
        isSubmitting
    } = useLogin();

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Поле: Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className={errors.password ? "text-red-500" : ""}>
                            Password
                        </Label>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className={`focus-visible:ring-blue-600 ${errors.password ? "border-red-500" : ""}`}
                        disabled={isSubmitting}
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className="text-sm font-medium text-red-500">{errors.password.message}</p>
                    )}
                </div>

                {/* Глобальная ошибка от сервера */}
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
                    {isSubmitting ? "Sign In..." : "Sign In"}
                </Button>
            </form>
        </div>
    );
}