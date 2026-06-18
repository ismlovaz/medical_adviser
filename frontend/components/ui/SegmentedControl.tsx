import { Control, useController, FieldValues, Path } from 'react-hook-form';
import { cn } from '@/lib/utils'; // Стандартная утилита shadcn для классов

interface Option {
    label: string;
    value: string | number;
}

interface SegmentedControlProps<T extends FieldValues> {
    name: Path<T>;
    control: Control<T>;
    label: string;
    options: Option[];
}

export function SegmentedControl<T extends FieldValues>({ name, control, label, options }: SegmentedControlProps<T>) {
    const { field } = useController({ name, control });

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <div className="flex p-1 bg-slate-100 rounded-xl">
                {options.map((option) => {
                    const isActive = field.value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                                'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                                isActive
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}