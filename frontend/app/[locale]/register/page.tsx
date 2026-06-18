import { Activity } from "lucide-react";
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations('Auth.Register');
    return {
        title: `Create Account | Smart Medical Advisor`,
        description: t('description')
    };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {

    const session = await auth.api.getSession({
        headers: await headers()
    });

    const params = await searchParams;
    const callbackUrl = typeof params.callbackUrl === 'string' ? params.callbackUrl : '/dashboard';

    if (session) {
        redirect(callbackUrl);
    }

    const t = await getTranslations('Auth.Register');

    return (
        <AuthWrapper
            icon={<Activity className="h-6 w-6" />}
            title={t('title')}
            description={t('description')}
            footerText={t('footerText')}
            footerLinkText={t('footerLink')}
            footerHref={`/login${params.callbackUrl ? `?callbackUrl=${params.callbackUrl}` : ''}`}
        >
            <RegisterForm />
        </AuthWrapper>
    );
}