"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export function LogoutButton() {
    const router = useRouter();
    const t = useTranslations('Dashboard');
    const [isPending, setIsPending] = useState(false);

    const handleSignOut = async () => {
        setIsPending(true);

        // Вызываем метод очистки сессии
        await signOut();

        // Перенаправляем пользователя на страницу входа
        router.push("/login");
    };

    return (
        <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={isPending}
            className="text-slate-600 hover:text-slate-900"
        >
            {isPending ? t('logoutLoading') : t('logout')}
            {/* Иконка из библиотеки lucide-react (идет в комплекте с shadcn) */}
            {!isPending && <LogOut className="ml-2 h-4 w-4" />}
        </Button>
    );
}