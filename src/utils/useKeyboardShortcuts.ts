import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onClear?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onIncreaseBrushSize?: () => void;
  onDecreaseBrushSize?: () => void;
  onToggleBrushMode?: () => void;
  onToggleCropMode?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

/**
 * Global Keyboard Shortcut Hook for ClearCut AI Editor
 * Supports:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 * - Delete / Backspace: Remove selected modifications or clear/reset workspace
 * - '[' and ']': Adjust brush size down / up
 * - '+' / '-': Zoom in / out
 * - '0': Reset zoom (100%)
 * - 'B': Toggle Refinement Brush
 * - 'C': Toggle Crop / Trim mode
 * - Escape: Cancel / close active modal or tool
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onDelete,
  onClear,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onIncreaseBrushSize,
  onDecreaseBrushSize,
  onToggleBrushMode,
  onToggleCropMode,
  onEscape,
  enabled = true,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Never intercept when user is typing into text inputs, textareas, selects, or editable content
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z / Cmd+Z (without shift)
      if (cmdOrCtrl && key === 'z' && !e.shiftKey) {
        if (onUndo) {
          e.preventDefault();
          onUndo();
          return;
        }
      }

      // Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z
      if ((cmdOrCtrl && key === 'y') || (cmdOrCtrl && key === 'z' && e.shiftKey)) {
        if (onRedo) {
          e.preventDefault();
          onRedo();
          return;
        }
      }

      // Delete / Backspace: Remove selected objects or clear/reset current workspace canvas
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (onDelete || onClear) {
          e.preventDefault();
          if (onDelete) {
            onDelete();
          } else if (onClear) {
            onClear();
          }
          return;
        }
      }

      // Escape: Cancel active tool or close panel
      if (e.key === 'Escape') {
        if (onEscape) {
          e.preventDefault();
          onEscape();
          return;
        }
      }

      // Brush size adjustments: '[' decrease, ']' increase
      if (e.key === '[') {
        if (onDecreaseBrushSize) {
          e.preventDefault();
          onDecreaseBrushSize();
          return;
        }
      }
      if (e.key === ']') {
        if (onIncreaseBrushSize) {
          e.preventDefault();
          onIncreaseBrushSize();
          return;
        }
      }

      // Tool toggles: 'b' for Brush, 'c' for Crop (only without ctrl/meta/alt)
      if (!cmdOrCtrl && !e.altKey) {
        if (key === 'b' && onToggleBrushMode) {
          e.preventDefault();
          onToggleBrushMode();
          return;
        }
        if (key === 'c' && onToggleCropMode) {
          e.preventDefault();
          onToggleCropMode();
          return;
        }
      }

      // Zoom controls: '+' / '=' for zoom in, '-' for zoom out, '0' for reset zoom
      if (cmdOrCtrl) {
        if (key === '=' || key === '+') {
          if (onZoomIn) {
            e.preventDefault();
            onZoomIn();
            return;
          }
        }
        if (key === '-') {
          if (onZoomOut) {
            e.preventDefault();
            onZoomOut();
            return;
          }
        }
        if (key === '0') {
          if (onResetZoom) {
            e.preventDefault();
            onResetZoom();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    onUndo,
    onRedo,
    onDelete,
    onClear,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onIncreaseBrushSize,
    onDecreaseBrushSize,
    onToggleBrushMode,
    onToggleCropMode,
    onEscape,
  ]);
}
