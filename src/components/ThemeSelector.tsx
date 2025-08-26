import React, { useState, useRef, useEffect } from 'react';
import { SunIcon, MoonIcon, DesktopIcon } from './icons';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeSelectorProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, setTheme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: 'Light', icon: <SunIcon /> },
        { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
        { value: 'system', label: 'System', icon: <DesktopIcon /> },
    ];

    const currentOption = options.find(opt => opt.value === theme);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (selectedTheme: Theme) => {
        setTheme(selectedTheme);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title={`Current theme: ${theme}`}
            >
                {currentOption?.icon}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    <ul className="py-1">
                        {options.map(option => (
                            <li key={option.value}>
                                <button
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                                        theme === option.value
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {option.icon}
                                    <span>{option.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
