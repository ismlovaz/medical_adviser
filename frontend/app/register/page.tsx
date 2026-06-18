import { Activity } from "lucide-react";
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { RegisterForm } from "@/components/auth/register-form";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Create Account | Smart Medical Advisor",
    description: "Start your journey toward clinical cardiac precision.",
};

export default async function RegisterPage() {

    const session = await auth.api.getSession({
        headers: await headers()
    });

    // 2. Если сессия найдена, значит пользователь уже внутри системы
    if (session) {
        redirect("/dashboard");
    }

    return (
        <AuthWrapper
            icon={<Activity className="h-6 w-6" />}
            title="Create your account"
            description="Start your journey toward clinical cardiac precision."
            footerText="Already have an account?"
            footerLinkText="Sign in"
            footerHref="/login"
        >
            <RegisterForm />
        </AuthWrapper>
    );
}