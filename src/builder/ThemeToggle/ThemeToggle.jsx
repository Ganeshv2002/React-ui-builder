import React from 'react';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from '../ThemeProvider/ThemeProvider';
export const ThemeToggle = () => {
  const { colorScheme, toggleColorScheme } = useTheme();
  const Icon = colorScheme === 'dark' ? IconSun : IconMoon;
  const label = 'Switch to ' + (colorScheme === 'dark' ? 'light' : 'dark') + ' theme';
  return <button type="button" className="editor-tool editor-theme-toggle" onClick={toggleColorScheme} aria-label={label} title={label}><Icon size={18} stroke={1.7} /></button>;
};
