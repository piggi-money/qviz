import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onRefresh?: () => void;
  onEscape?: () => void;
  onNewConnection?: () => void;
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape always works (for closing modals)
      if (event.key === 'Escape' && handlers.onEscape) {
        handlers.onEscape();
        return;
      }

      // Skip other shortcuts if typing
      if (isTyping) return;

      // R for refresh
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        handlers.onRefresh?.();
        return;
      }

      // N for new connection
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        handlers.onNewConnection?.();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

