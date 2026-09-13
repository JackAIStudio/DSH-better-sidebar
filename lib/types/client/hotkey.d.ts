import { type SidebarStore } from './state.ts';
export declare function isTypingTarget(el: EventTarget | null): boolean;
export declare function matchHotkey(e: KeyboardEvent): boolean;
/**
 * Execute the toggle action based on current state and prefs.
 * Returns true if an action was taken.
 */
export declare function executeHotkeyToggle(store: SidebarStore): boolean;
/**
 * Register the document-level capture hotkey listener.
 * Returns the disposer (HMR-safe, call through ctx.effect).
 */
export declare function registerHotkeyToggle(store: SidebarStore): () => void;
