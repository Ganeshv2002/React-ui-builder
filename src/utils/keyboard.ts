import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = !shortcut.ctrlKey || event.ctrlKey;
        const matchesShift = !shortcut.shiftKey || event.shiftKey;
        const matchesAlt = !shortcut.altKey || event.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          // Prevent default browser behavior
          if (shortcut.ctrlKey || shortcut.altKey) {
            event.preventDefault();
          }
          shortcut.action();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const KEYBOARD_SHORTCUTS = {
  PREVIEW: { key: 'p', ctrlKey: true, description: 'Toggle Preview Mode' },
  EXPORT: { key: 'e', ctrlKey: true, description: 'Export Code' },
  CLEAR: { key: 'Delete', ctrlKey: true, description: 'Clear Canvas' },
  SAVE: { key: 's', ctrlKey: true, description: 'Save Layout' },
  THEME: { key: 't', ctrlKey: true, description: 'Toggle Theme' },
  HELP: { key: '?', description: 'Show Help' }
};
