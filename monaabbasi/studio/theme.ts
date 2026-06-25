import {buildLegacyTheme} from 'sanity'

// Palette tuned to Fateme Abbasi's site (warm nude background, rose + gold
// accents) so the Studio feels like part of the same brand rather than a stock
// purple Sanity install.
export const monaStudioTheme = buildLegacyTheme({
  // Vazirmatn is first so Persian/Arabic glyphs use it (its @font-face is scoped
  // to Arabic codepoints), while Latin text falls through to Google Sans/Inter.
  '--font-family-base': 'Vazirmatn, Google Sans, Inter, Roboto, Estedad, system-ui, sans-serif',
  '--font-family-monospace': 'JetBrains Mono, ui-monospace, monospace',
  '--black': '#241a1c',
  '--white': '#fffaf7',
  '--brand-primary': '#b1466a',
  '--component-bg': '#fffaf7',
  '--component-text-color': '#241a1c',
  '--default-button-color': '#6b5560',
  '--default-button-primary-color': '#b1466a',
  '--default-button-success-color': '#1f7a55',
  '--default-button-warning-color': '#9a5a00',
  '--default-button-danger-color': '#ba1a1a',
  '--focus-color': '#b8862f',
  '--gray-base': '#8a7a80',
  '--gray': '#8a7a80',
  '--main-navigation-color': '#fdeef0',
  '--main-navigation-color--inverted': '#241a1c',
  '--state-info-color': '#1f6f7a',
  '--state-success-color': '#1f7a55',
  '--state-warning-color': '#9a5a00',
  '--state-danger-color': '#ba1a1a',
})
