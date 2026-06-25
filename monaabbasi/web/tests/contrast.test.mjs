import assert from 'node:assert/strict'
import test from 'node:test'

function channel(value) {
  const normalized = value / 255
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const value = hex.replace('#', '')
  return 0.2126 * channel(parseInt(value.slice(0, 2), 16)) +
    0.7152 * channel(parseInt(value.slice(2, 4), 16)) +
    0.0722 * channel(parseInt(value.slice(4, 6), 16))
}

function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

test('portfolio metadata meets WCAG AA normal-text contrast', () => {
  assert.ok(contrast('#c9b7ae', '#160f12') >= 4.5)
  assert.ok(contrast('#5f4c52', '#fffaf7') >= 4.5)
})
