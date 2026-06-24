import {Box, Button, Card, Flex, Stack, Tab, Text, TextArea} from '@sanity/ui'
import {useCallback, useId, useMemo, useState, type ComponentType} from 'react'
import {PatchEvent, set, unset, type PortableTextInputProps} from 'sanity'
import {
  hasNonTextBlocks,
  normalizeMarkdownBlocks,
  portableTextToEditableMarkdown,
} from './markdownHelpers.mjs'

type PortableValue = PortableTextInputProps['value']

export function MarkdownPortableTextInput(props: PortableTextInputProps) {
  const instanceId = useId().replaceAll(':', '')
  const visualTabId = `${instanceId}-visual-tab`
  const visualPanelId = `${instanceId}-visual-panel`
  const markdownTabId = `${instanceId}-markdown-tab`
  const markdownPanelId = `${instanceId}-markdown-panel`
  const [mode, setMode] = useState<'visual' | 'markdown'>('visual')
  const currentMarkdown = useMemo(
    () => portableTextToEditableMarkdown(props.value as PortableValue),
    [props.value],
  )
  const [markdown, setMarkdown] = useState(currentMarkdown)
  const containsMedia = useMemo(() => hasNonTextBlocks(props.value), [props.value])

  const showMarkdown = useCallback(() => {
    if (containsMedia) return
    setMarkdown(currentMarkdown)
    setMode('markdown')
  }, [containsMedia, currentMarkdown])

  const applyMarkdown = useCallback(() => {
    const nextValue = normalizeMarkdownBlocks(markdown)
    props.onChange(PatchEvent.from(nextValue.length ? set(nextValue) : unset()))
    setMode('visual')
  }, [markdown, props])

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} tone="transparent" border>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Box>
            <Text size={1} weight="semibold">
              Choose how you want to write
            </Text>
            <Text muted size={1}>
              Visual editing supports Markdown shortcuts. Markdown mode edits the text source.
            </Text>
          </Box>
          <Flex gap={1}>
            <Tab
              aria-controls={visualPanelId}
              aria-label="Visual editor"
              id={visualTabId}
              label="Visual"
              onClick={() => setMode('visual')}
              selected={mode === 'visual'}
            />
            <Tab
              aria-controls={markdownPanelId}
              aria-label="Markdown editor"
              disabled={containsMedia}
              id={markdownTabId}
              label="Markdown"
              onClick={showMarkdown}
              selected={mode === 'markdown'}
            />
          </Flex>
        </Flex>
      </Card>

      {mode === 'visual' ? (
        <Box aria-labelledby={visualTabId} id={visualPanelId} role="tabpanel">
          {props.renderDefault(props)}
          {containsMedia ? (
            <Card marginTop={3} padding={3} radius={2} tone="caution">
              <Text size={1}>
                Markdown source mode is unavailable while this field contains inline media. Use the
                visual editor to keep every image in its intended position.
              </Text>
            </Card>
          ) : null}
        </Box>
      ) : (
        <Card
          aria-labelledby={markdownTabId}
          id={markdownPanelId}
          padding={4}
          radius={2}
          role="tabpanel"
          shadow={1}
        >
          <Stack space={4}>
            <TextArea
              aria-label="Markdown source"
              disabled={props.readOnly}
              fontSize={2}
              onChange={(event) => setMarkdown(event.currentTarget.value)}
              padding={4}
              rows={18}
              value={markdown}
            />
            <Flex gap={2} justify="flex-end">
              <Button mode="ghost" onClick={() => setMode('visual')} text="Cancel" />
              <Button
                disabled={props.readOnly}
                onClick={applyMarkdown}
                text="Apply Markdown"
                tone="primary"
              />
            </Flex>
          </Stack>
        </Card>
      )}
    </Stack>
  )
}

// Sanity's schema inference currently widens mixed Portable Text arrays to the primitive input
// union. Keep the component itself strictly typed and expose a schema-compatible wrapper.
export const MarkdownPortableTextInputComponent = MarkdownPortableTextInput as ComponentType<any>
