import React, { createContext, useContext, useEffect, useState } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';

const ThemeContext = createContext(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within BuilderThemeProvider');
  }
  return context;
};

export const BuilderThemeProvider = ({ children }) => {
  const [colorScheme, setColorScheme] = useState(() => {
    // Initialize from localStorage or default to light
    const stored = localStorage.getItem('mantine-color-scheme');
    return (stored === 'dark' || stored === 'light') ? stored : 'light';
  });

  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
  };

  // Sync theme changes to document and localStorage
  useEffect(() => {
    document.documentElement.dataset.theme = colorScheme;
    localStorage.setItem('mantine-color-scheme', colorScheme);
  }, [colorScheme]);

  const theme = createTheme({
    primaryColor: 'blue',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    spacing: {
      xs: 'var(--gap)',
      sm: 'calc(var(--gap) * 1.5)',
      md: 'calc(var(--gap) * 2)',
      lg: 'calc(var(--gap) * 3)',
      xl: 'calc(var(--gap) * 4)',
    },
    radius: {
      xs: 'calc(var(--radius) * 0.5)',
      sm: 'calc(var(--radius) * 0.75)',
      md: 'var(--radius)',
      lg: 'calc(var(--radius) * 1.5)',
      xl: 'calc(var(--radius) * 2)',
    },
  });

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      <MantineProvider theme={theme} forceColorScheme={colorScheme}>
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  );
};
