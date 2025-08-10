import React from 'react';
import { ActionIcon } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { colorScheme, toggleColorScheme } = useTheme();

  return (
    <ActionIcon
      onClick={toggleColorScheme}
      size="lg"
      aria-label="Toggle theme"
      title={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {colorScheme === 'dark' ? (
        <IconSun size={18} />
      ) : (
        <IconMoon size={18} />
      )}
    </ActionIcon>
  );
};
