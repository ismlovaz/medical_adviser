import { LogoutButton } from "@/components/auth/logout-button";
import { auth } from "@/lib/auth"; // Импортируем серверное ядро
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
    // Сессия уже проверена в layout.tsx, поэтому мы можем быть уверены, что она есть
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // Из-за строгой типизации лучше оставить fallback (хотя layout.tsx нас сюда не пустит без сессии)
    if (!session) return null;

    const t = await getTranslations("Dashboard");

    // session.user доступен здесь точно так же, как и на клиенте
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">
                    {t("title")}
                </h1>
                <p className="text-slate-600">
                    {t("welcome")}, <span className="font-semibold">{session.user.name}</span>.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    {t("workEmail")} {session.user.email}
                </p>
                <p className="text-sm text-slate-500">
                    {t("internalId")} {session.user.id}
                </p>
                {/* Кнопка выхода */}
                <div className="mt-6">
                    <LogoutButton />
                </div>

                {/* Здесь в будущем будет выбор режима: Lifestyle или Clinical */}
            </div>
        </div>
    );
}