import {CheckmarkCircleIcon, LaunchIcon, TranslateIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import type {DocumentActionComponent} from 'sanity'
import {getWebsiteUrl} from '../lib/website'

export const OpenWebsiteAction: DocumentActionComponent = (props) => {
  const document = props.draft ?? props.published
  const url = getWebsiteUrl(props.type, document)

  return {
    label: 'Open on website',
    icon: LaunchIcon,
    onHandle: () => {
      window.open(url, '_blank', 'noopener,noreferrer')
      props.onComplete()
    },
    shortcut: 'Ctrl+Alt+O',
  }
}

OpenWebsiteAction.displayName = 'OpenWebsiteAction'

type LocalizedValue = {language?: string; value?: unknown}

function hasBoth(value: unknown) {
  if (!Array.isArray(value)) return false
  const languages = new Set(
    (value as LocalizedValue[])
      .filter((entry) => entry?.value != null && entry.value !== '')
      .map((entry) => entry.language),
  )
  return languages.has('en') && languages.has('fa')
}

function getChecklist(document: Record<string, any>) {
  if (document._type === 'production') {
    return [
      {label: 'Production title', ready: hasBoth(document.title)},
      {label: 'Visible image alternative text', ready: hasBoth(document.heroImage?.alt)},
    ]
  }

  return [
    {label: 'Public name', ready: hasBoth(document.name)},
    {label: 'Contact heading', ready: hasBoth(document.contact?.heading)},
    {label: 'SEO title', ready: hasBoth(document.seo?.title)},
    {label: 'SEO description', ready: hasBoth(document.seo?.description)},
    {label: 'Profile portrait alternative text', ready: hasBoth(document.headshot?.alt)},
    {label: 'Resume image alternative text', ready: hasBoth(document.resumeImage?.alt)},
    {
      label: 'Upcoming image alternative text',
      ready: !document.upcomingWork?.image || hasBoth(document.upcomingWork.image.alt),
    },
    {
      label: 'Gallery image alternative text',
      ready:
        !Array.isArray(document.gallery) ||
        document.gallery.every((item: Record<string, any>) => hasBoth(item?.image?.alt)),
    },
  ]
}

export const TranslationChecklistAction: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState(false)
  const document = (props.draft ?? props.published) as Record<string, any> | null
  const checklist = useMemo(() => (document ? getChecklist(document) : []), [document])
  const readyCount = checklist.filter((item) => item.ready).length

  return {
    label: `Translation checklist (${readyCount}/${checklist.length})`,
    icon: TranslateIcon,
    onHandle: () => setOpen(true),
    dialog: open
      ? {
          type: 'dialog',
          header: 'Launch translation checklist',
          onClose: () => setOpen(false),
          content: (
            <Box padding={4}>
              <Stack space={3}>
                <Text muted size={1}>
                  These public-facing fields need English and Persian before Sanity will publish.
                  Optional editorial copy can remain incomplete.
                </Text>
                {checklist.map((item) => (
                  <Card border key={item.label} padding={3} radius={2} tone={item.ready ? 'positive' : 'caution'}>
                    <Flex align="center" gap={3}>
                      {item.ready ? <CheckmarkCircleIcon /> : <WarningOutlineIcon />}
                      <Text size={1} weight="semibold">{item.label}</Text>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            </Box>
          ),
        }
      : undefined,
  }
}

TranslationChecklistAction.displayName = 'TranslationChecklistAction'
