import { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Link from "next/link";

interface AuthWrapperProps {
    children: ReactNode;
    icon: ReactNode;
    title: string;
    description: string;
    footerText: string;
    footerLinkText: string;
    footerHref: string;
}

export function AuthWrapper({
    children,
    icon,
    title,
    description,
    footerText,
    footerLinkText,
    footerHref,
}: AuthWrapperProps) {
    return (
        // Исправление проблемы с центрированием: используем min-h-screen и flex
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <Card className="w-full max-w-[420px] bg-white shadow-sm border-slate-200">
                <CardHeader className="flex flex-col items-center space-y-4 pt-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        {icon}
                    </div>
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            {title}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {description}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="pb-6">
                    {children}
                </CardContent>

                <CardFooter className="flex justify-center pb-8">
                    <div className="text-sm text-slate-500">
                        {footerText}{" "}
                        <Link href={footerHref} className="font-semibold text-blue-600 hover:text-blue-700">
                            {footerLinkText}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}