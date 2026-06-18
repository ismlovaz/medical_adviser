// components/auth/SignOutButton.tsx
'use client';

import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export function SignOutButton({ text }: { text: string }) {
    const router = useRouter();

    return (
        <button
            onClick={async () => {
                await signOut();
                router.refresh();
            }}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg transition-all"
        >
            {text}
        </button>
    );
}