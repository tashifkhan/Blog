/**
 * Key name → keycap glyph tables for the Kbd and Keys components. Copied from
 * dump.taf.sh's src/lib/keycaps.ts so a shortcut renders with the same caps on
 * every site. Mac glyphs first, with a Windows text-cap variant.
 */

export type Platform = 'mac' | 'win'
export type Cap = { g: string; t: string; mod?: boolean }

export const MAC: Record<string, Cap> = {
  ctrl: { g: '⌃', t: 'Control', mod: true },
  control: { g: '⌃', t: 'Control', mod: true },
  cmd: { g: '⌘', t: 'Command', mod: true },
  command: { g: '⌘', t: 'Command', mod: true },
  opt: { g: '⌥', t: 'Option', mod: true },
  option: { g: '⌥', t: 'Option', mod: true },
  alt: { g: '⌥', t: 'Option / Alt', mod: true },
  shift: { g: '⇧', t: 'Shift', mod: true },
  caps: { g: '⇪', t: 'Caps Lock', mod: true },
  capslock: { g: '⇪', t: 'Caps Lock', mod: true },
  fn: { g: 'fn', t: 'Function', mod: true },
  win: { g: '⌘', t: 'Command', mod: true },
  windows: { g: '⌘', t: 'Command', mod: true },
  super: { g: '⌘', t: 'Command', mod: true },
  meta: { g: '⌘', t: 'Command', mod: true },
  enter: { g: '↵', t: 'Return / Enter' },
  return: { g: '↵', t: 'Return' },
  esc: { g: '⎋', t: 'Escape' },
  escape: { g: '⎋', t: 'Escape' },
  tab: { g: '⇥', t: 'Tab' },
  space: { g: '␣', t: 'Space' },
  spacebar: { g: '␣', t: 'Space' },
  backspace: { g: '⌫', t: 'Delete' },
  del: { g: '⌫', t: 'Delete' },
  delete: { g: '⌦', t: 'Forward Delete' },
  up: { g: '↑', t: 'Up Arrow' },
  down: { g: '↓', t: 'Down Arrow' },
  left: { g: '←', t: 'Left Arrow' },
  right: { g: '→', t: 'Right Arrow' },
  pgup: { g: '⇞', t: 'Page Up' },
  pgdn: { g: '⇟', t: 'Page Down' },
  pgdown: { g: '⇟', t: 'Page Down' },
  home: { g: '↖', t: 'Home' },
  end: { g: '↘', t: 'End' },
}

export const WIN: Record<string, Cap> = {
  ctrl: { g: 'Ctrl', t: 'Control', mod: true },
  control: { g: 'Ctrl', t: 'Control', mod: true },
  cmd: { g: 'Win', t: 'Windows', mod: true },
  command: { g: 'Win', t: 'Windows', mod: true },
  win: { g: 'Win', t: 'Windows', mod: true },
  windows: { g: 'Win', t: 'Windows', mod: true },
  super: { g: 'Win', t: 'Windows', mod: true },
  meta: { g: 'Win', t: 'Windows', mod: true },
  opt: { g: 'Alt', t: 'Alt', mod: true },
  option: { g: 'Alt', t: 'Alt', mod: true },
  alt: { g: 'Alt', t: 'Alt', mod: true },
  shift: { g: 'Shift', t: 'Shift', mod: true },
  caps: { g: 'Caps', t: 'Caps Lock', mod: true },
  capslock: { g: 'Caps', t: 'Caps Lock', mod: true },
  fn: { g: 'Fn', t: 'Function', mod: true },
  enter: { g: 'Enter', t: 'Enter' },
  return: { g: 'Enter', t: 'Enter' },
  esc: { g: 'Esc', t: 'Escape' },
  escape: { g: 'Esc', t: 'Escape' },
  tab: { g: 'Tab', t: 'Tab' },
  space: { g: 'Space', t: 'Space' },
  spacebar: { g: 'Space', t: 'Space' },
  backspace: { g: 'Bksp', t: 'Backspace' },
  del: { g: 'Del', t: 'Delete' },
  delete: { g: 'Del', t: 'Delete' },
  up: { g: '↑', t: 'Up Arrow' },
  down: { g: '↓', t: 'Down Arrow' },
  left: { g: '←', t: 'Left Arrow' },
  right: { g: '→', t: 'Right Arrow' },
  pgup: { g: 'PgUp', t: 'Page Up' },
  pgdn: { g: 'PgDn', t: 'Page Down' },
  pgdown: { g: 'PgDn', t: 'Page Down' },
  home: { g: 'Home', t: 'Home' },
  end: { g: 'End', t: 'End' },
}

/** Glyph, tooltip and modifier flag for a key name. Unknown names render verbatim. */
export function resolveKey(
  k: string,
  platform: Platform = 'mac',
): { glyph: string; title: string; mod: boolean } {
  const name = k.trim()
  const hit = (platform === 'win' ? WIN : MAC)[name.toLowerCase()]
  return hit
    ? { glyph: hit.g, title: hit.t, mod: !!hit.mod }
    : { glyph: name, title: name, mod: false }
}

/** Split a `<Keys keys="…">` string into caps. "prefix" is a role, not a key: it renders as a named cap. */
export function splitKeys(keys: string): string[] {
  return keys
    .split(/\s+/)
    .filter(Boolean)
    .map((key) => (key.toLowerCase() === 'prefix' ? 'PREFIX' : key))
}
