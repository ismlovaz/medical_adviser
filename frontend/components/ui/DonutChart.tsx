import React from 'react';

interface DonutChartProps {
    percentage: number; // 0 to 100
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
}

export function DonutChart({
    percentage,
    size = 180,
    strokeWidth = 16,
    color = '#4F46E5', // indigo-600
    label
}: DonutChartProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    // Determine color based on risk percentage if not explicitly provided
    // Low: <30, Moderate: 30-70, High: >70
    let derivedColor = color;
    if (color === '#4F46E5') { // default
        if (percentage < 30) derivedColor = '#10B981'; // green-500
        else if (percentage < 70) derivedColor = '#F59E0B'; // amber-500
        else derivedColor = '#EF4444'; // red-500
    }

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    className="text-slate-100"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    stroke={derivedColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                    {Math.round(percentage)}%
                </span>
                {label && (
                    <span className="text-sm font-medium text-slate-500 mt-1">
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
}
