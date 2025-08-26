import { useState, useLayoutEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'system'
  );

  const applyTheme = useCallback((themeToApply: Theme) => {
    const root = window.document.documentElement;
    const isDark =
      themeToApply === 'dark' ||
      (themeToApply === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', themeToApply);
  }, []);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Re-apply theme only if the current setting is 'system'
      if (localStorage.getItem('theme') === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme]);

  return { theme, setTheme };
};

export default useTheme;
