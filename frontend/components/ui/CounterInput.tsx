import { Control, useController, FieldValues, Path } from 'react-hook-form';
import { Minus, Plus } from 'lucide-react';

interface CounterInputProps<T extends FieldValues> {
    name: Path<T>;
    control: Control<T>;
    label: string;
    unit: string;
    min?: number;
    max?: number;
    step?: number;
}

export function CounterInput<T extends FieldValues>({ name, control, label, unit, min = 0, max = 300, step = 1 }: CounterInputProps<T>) {
    const { field } = useController({ name, control });

    const handleDecrement = () => field.onChange(Math.max(min, Number(field.value) - step));
    const handleIncrement = () => field.onChange(Math.min(max, Number(field.value) + step));

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    <Minus size={18} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-slate-900 leading-none">{field.value}</span>
                    <span className="text-xs text-slate-500 font-medium">{unit}</span>
                </div>
                <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>
        </div>
    );
}