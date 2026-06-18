import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { LoginForm } from "@/components/auth/login-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations('Auth.Login');
    return {
        title: `Sign In | Smart Medical Advisor`,
        description: t('description')
    };
}

export default async function LoginPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session) {
        redirect("/dashboard");
    }

    const t = await getTranslations('Auth.Login');

    return (
        <AuthWrapper
            icon={<HeartPulse className="h-6 w-6" />}
            title={t('title')}
            description={t('description')}
            footerText={t('footerText')}
            footerLinkText={t('footerLink')}
            footerHref="/register"
        >
            <LoginForm />
        </AuthWrapper>
    );
}