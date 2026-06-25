import {markdownToPortableText, portableTextToMarkdown} from '@portabletext/markdown'

export function hasNonTextBlocks(value) {
  return (value ?? []).some((block) => block?._type !== 'block')
}

export function normalizeMarkdownBlocks(markdown) {
  return markdownToPortableText(markdown)
    .filter((block) => block._type === 'block')
    .map((block) => {
      const style = typeof block.style === 'string' ? block.style : 'normal'
      return {
        ...block,
        style: ['normal', 'h2', 'h3', 'blockquote'].includes(style)
          ? style
          : style === 'h1'
            ? 'h2'
            : 'h3',
      }
    })
}

export function portableTextToEditableMarkdown(value) {
  const textBlocks = (value ?? []).filter((block) => block?._type === 'block')
  return textBlocks.length ? portableTextToMarkdown(textBlocks) : ''
}
