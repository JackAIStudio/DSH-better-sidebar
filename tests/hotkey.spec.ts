// @vitest-environment jsdom
/**
 * Focus hotkey (Cmd/Ctrl + J) toggle handler unit tests.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { executeHotkeyToggle, isTypingTarget, matchHotkey, registerHotkeyToggle } from '../src/client/hotkey.ts'
import { createSidebarStore, type SidebarStore } from '../src/client/state.ts'

describe('matchHotkey', () => {
  it('matches Cmd+J on macOS and Ctrl+J on Windows/Linux', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'j', metaKey: true }))).toBe(true)
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'J', ctrlKey: true }))).toBe(true)
    expect(matchHotkey(new KeyboardEvent('keydown', { code: 'KeyJ', metaKey: true }))).toBe(true)
  })

  it('rejects keys without meta or ctrl', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'j' }))).toBe(false)
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'J' }))).toBe(false)
  })

  it('rejects modifier combos with alt or shift', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'j', metaKey: true, altKey: true }))).toBe(false)
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true, shiftKey: true }))).toBe(false)
  })
})

describe('isTypingTarget', () => {
  it('identifies inputs, textareas, and select elements as typing targets', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const select = document.createElement('select')
    const div = document.createElement('div')
    const editable = document.createElement('div')
    editable.contentEditable = 'true'

    expect(isTypingTarget(input)).toBe(true)
    expect(isTypingTarget(textarea)).toBe(true)
    expect(isTypingTarget(select)).toBe(true)
    expect(isTypingTarget(editable)).toBe(true)
    expect(isTypingTarget(div)).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})

describe('executeHotkeyToggle', () => {
  let store: SidebarStore

  beforeEach(() => {
    store = createSidebarStore()
    store.setSession('session-1', '/workspace')
  })

  it('toggles only the right panel when target is panel', () => {
    store.setPrefs({ ...store.getPrefs(), hotkeyToggleTarget: 'panel' })
    const initial = store.getSnapshot().state!
    expect(initial.panelOpen).toBe(false)
    expect(initial.bottomOpen).toBe(false)

    executeHotkeyToggle(store)
    let state = store.getSnapshot().state!
    expect(state.panelOpen).toBe(true)
    expect(state.bottomOpen).toBe(false)

    executeHotkeyToggle(store)
    state = store.getSnapshot().state!
    expect(state.panelOpen).toBe(false)
    expect(state.bottomOpen).toBe(false)
  })

  it('toggles only the bottom panel when target is bottom', () => {
    store.setPrefs({ ...store.getPrefs(), hotkeyToggleTarget: 'bottom' })
    const initial = store.getSnapshot().state!
    expect(initial.panelOpen).toBe(false)
    expect(initial.bottomOpen).toBe(false)

    executeHotkeyToggle(store)
    let state = store.getSnapshot().state!
    expect(state.panelOpen).toBe(false)
    expect(state.bottomOpen).toBe(true)

    executeHotkeyToggle(store)
    state = store.getSnapshot().state!
    expect(state.panelOpen).toBe(false)
    expect(state.bottomOpen).toBe(false)
  })

  it('toggles both panels (focus mode) when target is both', () => {
    store.setPrefs({ ...store.getPrefs(), hotkeyToggleTarget: 'both' })
    const initial = store.getSnapshot().state!
    expect(initial.panelOpen).toBe(false)
    expect(initial.bottomOpen).toBe(false)

    // All closed -> open both
    executeHotkeyToggle(store)
    let state = store.getSnapshot().state!
    expect(state.panelOpen).toBe(true)
    expect(state.bottomOpen).toBe(true)

    // Both open -> close both
    executeHotkeyToggle(store)
    state = store.getSnapshot().state!
    expect(state.panelOpen).toBe(false)
    expect(state.bottomOpen).toBe(false)

    // One open -> close all
    store.setPrefs({ ...store.getPrefs(), hotkeyToggleTarget: 'panel' })
    executeHotkeyToggle(store) // open panel
    store.setPrefs({ ...store.getPrefs(), hotkeyToggleTarget: 'both' })
    expect(store.getSnapshot().state!.panelOpen).toBe(true)
    expect(store.getSnapshot().state!.bottomOpen).toBe(false)

    executeHotkeyToggle(store) // closes all
    state = store.getSnapshot().state!
    expect(state.panelOpen).toBe(false)
    expect(state.bottomOpen).toBe(false)
  })
})

describe('registerHotkeyToggle', () => {
  let store: SidebarStore
  let cleanup: (() => void) | undefined

  beforeEach(() => {
    store = createSidebarStore()
    store.setSession('session-1', '/workspace')
    cleanup = registerHotkeyToggle(store)
  })

  afterEach(() => {
    cleanup?.()
  })

  it('triggers on Cmd+J keydown and prevents default', () => {
    const event = new KeyboardEvent('keydown', { key: 'j', metaKey: true, bubbles: true, cancelable: true })
    window.dispatchEvent(event)
    expect(store.getSnapshot().state!.panelOpen).toBe(true)
    expect(event.defaultPrevented).toBe(true)
  })

  it('ignores keydown in input target', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    const event = new KeyboardEvent('keydown', { key: 'j', metaKey: true, bubbles: true, cancelable: true })
    input.dispatchEvent(event)
    expect(store.getSnapshot().state!.panelOpen).toBe(false)
    input.remove()
  })
})
