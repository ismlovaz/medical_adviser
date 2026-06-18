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

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const params = await searchParams;
    const callbackUrl = typeof params.callbackUrl === 'string' ? params.callbackUrl : '/dashboard';

    if (session) {
        redirect(callbackUrl);
    }

    const t = await getTranslations('Auth.Login');

    return (
        <AuthWrapper
            icon={<HeartPulse className="h-6 w-6" />}
            title={t('title')}
            description={t('description')}
            footerText={t('footerText')}
            footerLinkText={t('footerLink')}
            footerHref={`/register${params.callbackUrl ? `?callbackUrl=${params.callbackUrl}` : ''}`}
        >
            <LoginForm />
        </AuthWrapper>
    );
}