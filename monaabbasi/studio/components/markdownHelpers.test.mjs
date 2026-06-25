import assert from 'node:assert/strict'
import test from 'node:test'

import {
  hasNonTextBlocks,
  normalizeMarkdownBlocks,
  portableTextToEditableMarkdown,
} from './markdownHelpers.mjs'

const textBlock = {
  _key: 'text',
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{_key: 'span', _type: 'span', marks: [], text: 'Before the image'}],
}

test('mixed-media Portable Text cannot enter destructive Markdown mode', () => {
  assert.equal(hasNonTextBlocks([textBlock, {_key: 'image', _type: 'portfolioImage'}]), true)
  assert.equal(hasNonTextBlocks([textBlock]), false)
})

test('text-only Markdown round-trips without losing content', () => {
  const markdown = portableTextToEditableMarkdown([textBlock])
  const blocks = normalizeMarkdownBlocks(markdown)
  assert.equal(blocks[0].children[0].text, 'Before the image')
})
