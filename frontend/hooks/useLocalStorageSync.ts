import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { BasicScreeningFormValues } from '@/lib/validations/screening';

const STORAGE_KEY = 'pending_screening_data';

export const useLocalStorageSync = (methods: UseFormReturn<BasicScreeningFormValues>) => {
    // Восстановление данных при загрузке
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                methods.reset(JSON.parse(saved));
                localStorage.removeItem(STORAGE_KEY); // Очищаем после восстановления
            } catch (e) {
                console.error("Failed to parse saved form data", e);
            }
        }
    }, [methods]);

    // Метод для сохранения перед редиректом
    const saveToStorage = (data: BasicScreeningFormValues) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    return { saveToStorage };
};