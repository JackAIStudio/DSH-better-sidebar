/**
 * Native focus hotkey (Cmd/Ctrl + J) toggle handler for dsh-better-sidebar.
 *
 * Codex/VSCode-style focus shortcut:
 * - Cmd/Ctrl + J collapses or restores sidebar panels based on user preference
 *   (`hotkeyToggleTarget`: 'both' | 'panel' | 'bottom').
 * - Respects active input elements, contenteditable, IME composition, and key repeats.
 * - Directly drives SidebarStore without synthetic DOM clicks.
 */
import { isNarrowWidth } from './breakpoints.ts'
import { isImeComposition } from './ime-guard.ts'
import { toggleBottomPanel, togglePanel, type SidebarStore } from './state.ts'

export function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) return false
  const htmlEl = el as HTMLElement
  if (htmlEl.isContentEditable || htmlEl.contentEditable === 'true' || el.getAttribute('contenteditable') === 'true' || el.getAttribute('contenteditable') === '') return true
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function matchHotkey(e: KeyboardEvent): boolean {
  if (!(e.metaKey || e.ctrlKey)) return false
  if (e.altKey || e.shiftKey) return false
  return e.code === 'KeyJ' || e.key === 'j' || e.key === 'J'
}

/**
 * Execute the toggle action based on current state and prefs.
 * Returns true if an action was taken.
 */
export function executeHotkeyToggle(store: SidebarStore): boolean {
  const snapshot = store.getSnapshot()
  const state = snapshot.state
  if (!state) return false

  const target = store.getPrefs().hotkeyToggleTarget ?? 'both'
  const isNarrow = typeof window !== 'undefined' ? isNarrowWidth(window.innerWidth) : false

  if (isNarrow || target === 'panel') {
    store.reduce(togglePanel)
    return true
  }

  if (target === 'bottom') {
    store.reduce(toggleBottomPanel)
    return true
  }

  // target === 'both' (Focus mode):
  // If either panel is open -> close both.
  // If both are closed -> open both.
  const anyOpen = state.panelOpen || state.bottomOpen
  if (anyOpen) {
    if (state.panelOpen) store.reduce(togglePanel)
    if (state.bottomOpen) store.reduce(toggleBottomPanel)
  } else {
    store.reduce(togglePanel)
    store.reduce(toggleBottomPanel)
  }
  return true
}

/**
 * Register the document-level capture hotkey listener.
 * Returns the disposer (HMR-safe, call through ctx.effect).
 */
export function registerHotkeyToggle(store: SidebarStore): () => void {
  const onKey = (e: KeyboardEvent): void => {
    if (!matchHotkey(e)) return
    if (e.repeat || isImeComposition(e)) return
    if (isTypingTarget(e.target)) return

    e.preventDefault()
    e.stopPropagation()
    executeHotkeyToggle(store)
  }

  window.addEventListener('keydown', onKey, true)
  return () => {
    window.removeEventListener('keydown', onKey, true)
  }
}
