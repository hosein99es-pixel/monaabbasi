import {Badge, Box, Card, Flex, Grid, Heading, Stack, Text} from '@sanity/ui'
import type {UserViewComponent} from 'sanity/structure'

type LocalizedString = Array<{language?: string; value?: string}>
type PortableBlock = {children?: Array<{text?: string}>}
type LocalizedBlocks = Array<{language?: string; value?: PortableBlock[]}>

function localized(value: unknown, language = 'en') {
  if (!Array.isArray(value)) return ''
  return (value as LocalizedString).find((item) => item.language === language)?.value ?? ''
}

function richText(value: unknown, language = 'en') {
  if (!Array.isArray(value)) return ''
  const blocks = (value as LocalizedBlocks).find((item) => item.language === language)?.value ?? []
  return blocks
    .flatMap((block) => block.children ?? [])
    .map((span) => span.text ?? '')
    .join(' ')
}

const sectionCards = [
  ['Profile', '#main', 'name'],
  ['Resume', '#resume', 'education'],
  ['Theatre', '#work', 'productions'],
  ['Film & TV', '#film', 'productions'],
  ['Awards', '#awards', 'awards'],
  ['Teaching', '#teaching', 'teachingExperiences'],
  ['Upcoming', '#upcoming', 'upcomingWork'],
  ['Gallery', '#gallery', 'gallery'],
  ['Downloads', '#downloads', 'downloads'],
  ['Contact', '#contact', 'contact'],
] as const

export const ContentPlacementView: UserViewComponent = ({document, schemaType}) => {
  const value = document.displayed as Record<string, unknown>

  if (schemaType.name === 'portfolioPage') {
    const name = localized(value.name) || 'Fateme Abbasi'
    const intro = richText(value.intro)

    return (
      <Box padding={5} style={{background: '#1b1115', minHeight: '100%'}}>
        <Stack space={5}>
          <Card padding={5} radius={4} style={{background: '#2d1a22', color: '#f0e3d6'}}>
            <Stack space={3}>
              <Badge tone="caution">Homepage</Badge>
              <Heading size={4}>{name}</Heading>
              <Text muted size={2}>
                {intro || 'Add the profile introduction to see a live editorial summary here.'}
              </Text>
            </Stack>
          </Card>
          <Grid columns={[1, 2, 2, 3]} gap={3}>
            {sectionCards.map(([title, anchor, field], index) => {
              const content = value[field]
              const count = Array.isArray(content) ? content.length : content ? 1 : 0
              return (
                <Card key={`${title}-${anchor}`} padding={4} radius={3} shadow={1}>
                  <Stack space={3}>
                    <Flex align="center" justify="space-between">
                      <Badge tone={count ? 'positive' : 'default'}>
                        {count ? 'Content ready' : 'Empty'}
                      </Badge>
                      <Text muted size={1}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </Flex>
                    <Heading size={2}>{title}</Heading>
                    <Text muted size={1}>
                      Appears at {anchor}
                    </Text>
                  </Stack>
                </Card>
              )
            })}
          </Grid>
        </Stack>
      </Box>
    )
  }

  if (schemaType.name === 'production') {
    const title = localized(value.title) || 'Untitled production'
    const year = localized(value.yearDisplay)
    const role = localized(value.role)
    const director = localized(value.director)
    const summary = richText(value.summary)

    return (
      <Box padding={5} style={{background: '#1b1115', minHeight: '100%'}}>
        <Card padding={6} radius={4} style={{background: '#2d1a22', color: '#f0e3d6'}}>
          <Stack space={4}>
            <Flex gap={2} wrap="wrap">
              <Badge tone="caution">{String(value.medium ?? 'Production')}</Badge>
              {year ? <Badge>{year}</Badge> : null}
              {role ? <Badge>{role}</Badge> : null}
            </Flex>
            <Heading size={5}>{title}</Heading>
            {director ? <Text muted>Directed by {director}</Text> : null}
            <Text size={2}>{summary || 'Add a summary to preview the production story.'}</Text>
            <Text muted size={1}>
              Website placement:{' '}
              {['film', 'shortFilm', 'television'].includes(String(value.medium))
                ? '#film'
                : '#work'}
            </Text>
          </Stack>
        </Card>
      </Box>
    )
  }

  return (
    <Box padding={5}>
      <Card padding={5} radius={3} shadow={1}>
        <Stack space={3}>
          <Badge tone="primary">Website content</Badge>
          <Heading size={3}>{String(value.title ?? schemaType.title)}</Heading>
          <Text muted>{String(value.excerpt ?? 'This document is connected to the website.')}</Text>
        </Stack>
      </Card>
    </Box>
  )
}
