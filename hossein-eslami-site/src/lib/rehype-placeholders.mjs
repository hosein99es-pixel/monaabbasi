// Wraps [UPPERCASE PLACEHOLDERS] in Markdown into <span class="ph">, and marks paragraphs that
// contain nothing but a placeholder as .ph-block, so they can be hidden when review mode is off.
const RE = /\[[A-Z][A-Z0-9 \-–&/]*\]/g;

export default function rehypePlaceholders() {
  const walk = (node) => {
    if (!node.children) return;
    const out = [];
    for (const child of node.children) {
      if (child.type === 'text' && RE.test(child.value)) {
        RE.lastIndex = 0;
        let last = 0;
        for (const m of child.value.matchAll(RE)) {
          if (m.index > last) out.push({ type: 'text', value: child.value.slice(last, m.index) });
          out.push({
            type: 'element',
            tagName: 'span',
            properties: { className: ['ph'] },
            children: [{ type: 'text', value: m[0] }],
          });
          last = m.index + m[0].length;
        }
        if (last < child.value.length) out.push({ type: 'text', value: child.value.slice(last) });
      } else {
        walk(child);
        out.push(child);
      }
    }
    node.children = out;
    if (node.type === 'element' && node.tagName === 'p') {
      const real = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
      if (real.length && real.every((c) => c.type === 'element' && c.properties?.className?.includes('ph'))) {
        node.properties = { ...node.properties, className: ['ph-block'] };
      }
    }
  };
  return (tree) => walk(tree);
}
