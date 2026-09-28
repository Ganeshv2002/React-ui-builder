import { useEffect } from "react";

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
      const target = event.target as HTMLElement | null;
      // Keep native editing shortcuts and modal keyboard handling intact.
      if (
        target?.closest?.(
          'input, textarea, select, [contenteditable="true"], dialog[open], [role="dialog"]',
        )
      )
        return;
      if (event.repeat) return;
      const shortcut = shortcuts.find(
        (item) =>
          event.key.toLowerCase() === item.key.toLowerCase() &&
          Boolean(item.ctrlKey) === (event.ctrlKey || event.metaKey) &&
          Boolean(item.shiftKey) === event.shiftKey &&
          Boolean(item.altKey) === event.altKey,
      );
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

export const KEYBOARD_SHORTCUTS = {
  PREVIEW: { key: "p", ctrlKey: true, description: "Toggle Preview Mode" },
  EXPORT: { key: "e", ctrlKey: true, description: "Export Code" },
  CLEAR: { key: "Delete", ctrlKey: true, description: "Clear Canvas" },
  SAVE: { key: "s", ctrlKey: true, description: "Save Layout" },
  THEME: { key: "t", ctrlKey: true, description: "Toggle Theme" },
  HELP: { key: "?", description: "Show Help" },
};
