import {Badge, Box, Card, Flex, Grid, Heading, Stack, Text} from '@sanity/ui'
import type {UserViewComponent} from 'sanity/structure'
import styled from 'styled-components'

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
  ['Profile', 'Homepage hero', 'name'],
  ['Resume', 'Resume section', 'education'],
  ['Theatre', 'Theatre section', 'productions'],
  ['Film & TV', 'Film & TV section', 'productions'],
  ['Awards', 'Awards section', 'awards'],
  ['Teaching', 'Teaching section', 'teachingExperiences'],
  ['Upcoming', 'Upcoming highlight', 'upcomingWork'],
  ['Gallery', 'Photo gallery', 'gallery'],
  ['Downloads', 'Downloads section', 'downloads'],
  ['Contact', 'Contact section', 'contact'],
] as const

const productionMediumLabels: Record<string, string> = {
  theatre: 'Theatre section',
  performance: 'Theatre section',
  shortFilm: 'Film & TV section',
  film: 'Film & TV section',
  television: 'Film & TV section',
}

const PlacementShell = styled(Box)`
  min-height: 100%;
  background:
    radial-gradient(circle at 12% 0%, rgba(234, 221, 255, 0.95), transparent 24rem),
    radial-gradient(circle at 100% 14%, rgba(184, 243, 240, 0.75), transparent 22rem),
    linear-gradient(180deg, #fffbff 0%, #fef7ff 55%, #f7f2fa 100%);
`

const PlacementHero = styled(Card)`
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(103, 80, 164, 0.16);
  border-radius: 34px;
  background:
    radial-gradient(circle at 90% 12%, rgba(255, 216, 228, 0.94), transparent 18rem),
    linear-gradient(135deg, #fffbff 0%, #f7f2fa 64%, #eaddff 100%);
  color: #1d1b20;

  &::after {
    content: '';
    position: absolute;
    width: 10rem;
    height: 10rem;
    right: -3rem;
    bottom: -3rem;
    border-radius: 42% 58% 48% 52%;
    background: linear-gradient(135deg, #6750a4, #006a6a);
    opacity: 0.14;
  }
`

const PlacementTile = styled(Card)`
  height: 100%;
  border: 1px solid rgba(73, 69, 79, 0.14);
  border-radius: 26px;
  background: rgba(255, 251, 255, 0.92);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: rgba(103, 80, 164, 0.32);
    box-shadow: 0 18px 44px rgba(58, 48, 83, 0.12);
    transform: translateY(-2px);
  }
`

const Pill = styled(Badge)<{$ready?: boolean}>`
  border-radius: 999px;
  color: ${({$ready}) => ($ready ? '#00201f' : '#311300')};
  background: ${({$ready}) => ($ready ? '#b8f3f0' : '#ffdcc2')};
  font-weight: 750;
`

const Kicker = styled(Text)`
  width: fit-content;
  padding: 0.42rem 0.75rem;
  border-radius: 999px;
  color: #21005d;
  background: #eaddff;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const ContentPlacementView: UserViewComponent = ({document, schemaType}) => {
  const value = document.displayed as Record<string, unknown>

  if (schemaType.name === 'portfolioPage') {
    const name = localized(value.name) || 'Fateme Abbasi'
    const intro = richText(value.intro)

    return (
      <PlacementShell padding={5}>
        <Stack space={5}>
          <PlacementHero padding={5}>
            <Stack space={3}>
              <Kicker size={0}>Homepage placement</Kicker>
              <Heading size={5} style={{letterSpacing: '-.055em', lineHeight: 0.98}}>
                {name}
              </Heading>
              <Text size={2} style={{maxWidth: 780, color: '#625b71', lineHeight: 1.62}}>
                {intro || 'Add the profile introduction to see a live editorial summary here.'}
              </Text>
            </Stack>
          </PlacementHero>
          <Grid columns={[1, 2, 2, 3]} gap={3}>
            {sectionCards.map(([title, location, field], index) => {
              const content = value[field]
              const count = Array.isArray(content) ? content.length : content ? 1 : 0
              return (
                <PlacementTile key={`${title}-${location}`} padding={4} shadow={1}>
                  <Stack space={3}>
                    <Flex align="center" justify="space-between">
                      <Pill $ready={!!count}>
                        {count ? 'Content ready' : 'Empty'}
                      </Pill>
                      <Text size={1} style={{color: '#6750a4', fontWeight: 800}}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </Flex>
                    <Heading size={3} style={{letterSpacing: '-.035em'}}>
                      {title}
                    </Heading>
                    <Text muted size={1}>
                      Appears in: {location}
                    </Text>
                  </Stack>
                </PlacementTile>
              )
            })}
          </Grid>
        </Stack>
      </PlacementShell>
    )
  }

  if (schemaType.name === 'production') {
    const title = localized(value.title) || 'Untitled production'
    const year = localized(value.yearDisplay)
    const role = localized(value.role)
    const director = localized(value.director)
    const summary = richText(value.summary)

    return (
      <PlacementShell padding={5}>
        <PlacementHero padding={6}>
          <Stack space={4}>
            <Flex gap={2} wrap="wrap">
              <Pill $ready>{String(value.medium ?? 'Production')}</Pill>
              {year ? <Badge>{year}</Badge> : null}
              {role ? <Badge>{role}</Badge> : null}
            </Flex>
            <Heading size={5} style={{letterSpacing: '-.055em', lineHeight: 0.98}}>
              {title}
            </Heading>
            {director ? <Text style={{color: '#625b71'}}>Directed by {director}</Text> : null}
            <Text size={2} style={{maxWidth: 760, color: '#49454f', lineHeight: 1.65}}>
              {summary || 'Add a summary to preview the production story.'}
            </Text>
            <Text size={1} style={{color: '#625b71'}}>
              Appears in: {productionMediumLabels[String(value.medium)] ?? 'Portfolio sections'}
            </Text>
          </Stack>
        </PlacementHero>
      </PlacementShell>
    )
  }

  return (
    <PlacementShell padding={5}>
      <PlacementTile padding={5} shadow={1}>
        <Stack space={3}>
          <Kicker size={0}>Website content</Kicker>
          <Heading size={3} style={{letterSpacing: '-.035em'}}>
            {String(value.title ?? schemaType.title)}
          </Heading>
          <Text muted>{String(value.excerpt ?? 'This document is connected to the website.')}</Text>
        </Stack>
      </PlacementTile>
    </PlacementShell>
  )
}
