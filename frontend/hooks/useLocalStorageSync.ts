import { useEffect } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

const STORAGE_KEY = 'pending_screening_data';

export const useLocalStorageSync = <T extends FieldValues>(methods: UseFormReturn<T>) => {
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
    const saveToStorage = (data: T) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    return { saveToStorage };
};