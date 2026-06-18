import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In | Smart Medical Advisor",
    description: "Access your clinical dashboard to review AI cardiac predictions.",
};

export default async function LoginPage() {
    // Проверка сессии для защиты роута
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // Если пользователь залогинен — не даем ему смотреть на форму входа
    if (session) {
        redirect("/dashboard");
    }

    return (
        <AuthWrapper
            icon={<HeartPulse className="h-6 w-6" />}
            title="Welcome back"
            description="Enter your credentials to access your clinical dashboard."
            footerText="Don't have an account?"
            footerLinkText="Sign up"
            footerHref="/register"
        >
            <LoginForm />
        </AuthWrapper>
    );
}