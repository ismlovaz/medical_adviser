// components/layout/Header.tsx
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { SignOutButton } from './auth/SignOutButton';
import { getTranslations } from 'next-intl/server';

export async function Header() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    
    const t = await getTranslations("Header");

    return (
        <header className="w-full py-4 px-6 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-50">
            {/* Логотип */}
            <Link href="/" className="flex items-center gap-2">
                <span className="font-bold text-xl text-blue-900 tracking-tight">
                    {t("logo")}
                </span>
            </Link>

            {/* Навигация */}
            <nav className="flex items-center gap-2">
                {session ? (
                    <>
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            {t("dashboard")}
                        </Link>
                        <SignOutButton text={t("logout")} />
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            {t("login")}
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl 
                         hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 
                         active:scale-[0.98] transition-all duration-300"
                        >
                            {t("register")}
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}