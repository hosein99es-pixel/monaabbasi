type Span = {_key?: string; _type?: string; text?: string}
type Block = {_key?: string; _type?: string; children?: Span[]; style?: string}

function blockText(block: Block) {
  return (block.children ?? []).map((child) => child.text ?? '').join('')
}

export function PortableText({value, className}: {value?: Block[] | null; className?: string}) {
  if (!value?.length) return null

  return (
    <div className={className}>
      {value.map((block, index) => {
        const text = blockText(block)
        const key = block._key ?? `${block.style}-${index}`
        if (block.style === 'h2') return <h3 key={key}>{text}</h3>
        if (block.style === 'h3') return <h4 key={key}>{text}</h4>
        if (block.style === 'blockquote') return <blockquote key={key}>{text}</blockquote>
        return <p key={key}>{text}</p>
      })}
    </div>
  )
}
