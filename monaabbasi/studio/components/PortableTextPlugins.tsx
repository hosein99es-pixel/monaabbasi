import type {PortableTextPluginsProps} from 'sanity'

export function PortableTextPlugins(props: PortableTextPluginsProps) {
  const markdown = props.plugins.markdown

  return props.renderDefault({
    ...props,
    plugins: {
      ...props.plugins,
      markdown: markdown && 'config' in markdown ? markdown : {...markdown, enabled: true},
      pasteLink: {...props.plugins.pasteLink, enabled: true},
      typography: {...props.plugins.typography, enabled: true},
    },
  })
}
