import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import type {UserViewComponent} from 'sanity/structure'
import {getWebsiteUrl} from '../lib/website'

type PreviewOptions = {origin?: string}

export const WebsitePreviewView: UserViewComponent<PreviewOptions> = ({
  document,
  options,
  schemaType,
}) => {
  const url = getWebsiteUrl(schemaType.name, document.displayed, options.origin)

  return (
    <Flex direction="column" style={{height: '100%'}}>
      <Card borderBottom padding={3} tone="transparent">
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Published website placement
            </Text>
            <Text muted size={1}>
              {url} · Use the Live preview tool for click-to-edit draft editing.
            </Text>
          </Stack>
          <Button as="a" href={url} mode="ghost" target="_blank" text="Open in new tab ↗" />
        </Flex>
      </Card>
      <Box flex={1} style={{minHeight: 0}}>
        <iframe
          src={url}
          title={`Website preview for ${schemaType.title}`}
          style={{border: 0, width: '100%', height: '100%', minHeight: '70vh', background: '#fff'}}
        />
      </Box>
    </Flex>
  )
}
