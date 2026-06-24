import {
  ArrowRightIcon,
  BlockContentIcon,
  BookIcon,
  CheckmarkCircleIcon,
  ComposeIcon,
  EnvelopeIcon,
  EyeOpenIcon,
  HomeIcon,
  ImageIcon,
  LinkIcon,
  PlayIcon,
  ProjectsIcon,
  RefreshIcon,
  RocketIcon,
  StarIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {Badge, Box, Button, Card, Flex, Grid, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState, type ComponentType} from 'react'
import {useClient, type Tool} from 'sanity'
import {IntentLink} from 'sanity/router'
import styled from 'styled-components'
import {defaultWebsiteOrigin} from '../lib/website'

type LocalizedValue = {
  language?: string
  value?: unknown
}

type PortfolioDocument = {
  awards?: unknown[]
  contact?: Record<string, unknown>
  downloads?: Record<string, unknown>
  education?: unknown[]
  gallery?: unknown[]
  headshot?: Record<string, unknown>
  intro?: LocalizedValue[]
  name?: LocalizedValue[]
  resumeBody?: LocalizedValue[]
  resumeHeading?: LocalizedValue[]
  roles?: unknown[]
  seo?: Record<string, unknown>
  skills?: unknown[]
  teachingExperiences?: unknown[]
  upcomingWork?: Record<string, unknown>
}

type DashboardData = {
  filmCount: number
  portfolio: PortfolioDocument | null
  productionCount: number
  theatreCount: number
}

type SectionKey =
  | 'profile'
  | 'resume'
  | 'theatre'
  | 'film'
  | 'awards'
  | 'teaching'
  | 'upcoming'
  | 'gallery'
  | 'downloads'
  | 'contact'
  | 'seo'

type SiteSection = {
  description: string
  editorTab: string
  icon: ComponentType
  key: SectionKey
  fieldPath: string
  title: string
  titleFa: string
}

type SectionState = {
  detail: string
  ready: boolean
}

const dashboardQuery = `{
  "portfolio": *[_id == "portfolioPage"][0]{
    name,
    intro,
    headshot,
    roles,
    resumeHeading,
    resumeBody,
    education,
    skills,
    awards,
    teachingExperiences,
    upcomingWork,
    gallery,
    downloads,
    contact,
    seo
  },
  "productionCount": count(*[_type == "production"]),
  "theatreCount": count(*[_type == "production" && medium in ["theatre", "performance"]]),
  "filmCount": count(*[_type == "production" && medium in ["shortFilm", "film", "television"]])
}`

const sections: SiteSection[] = [
  {
    key: 'profile',
    fieldPath: 'name',
    title: 'Profile',
    titleFa: 'معرفی',
    editorTab: '01 · Profile',
    icon: HomeIcon,
    description: 'Name, introduction, roles and portrait',
  },
  {
    key: 'resume',
    fieldPath: 'resumeHeading',
    title: 'Resume',
    titleFa: 'رزومه',
    editorTab: '02 · Resume',
    icon: BookIcon,
    description: 'Biography, education and skills',
  },
  {
    key: 'theatre',
    fieldPath: 'productions',
    title: 'Theatre',
    titleFa: 'تئاتر',
    editorTab: '03 · Theatre',
    icon: PlayIcon,
    description: 'Stage and performance credits',
  },
  {
    key: 'film',
    fieldPath: 'productions',
    title: 'Film & TV',
    titleFa: 'فیلم و تلویزیون',
    editorTab: '04 · Film & TV',
    icon: ProjectsIcon,
    description: 'Screen work and film credits',
  },
  {
    key: 'awards',
    fieldPath: 'awards',
    title: 'Awards',
    titleFa: 'جوایز',
    editorTab: '05 · Awards',
    icon: StarIcon,
    description: 'Honors and recognitions',
  },
  {
    key: 'teaching',
    fieldPath: 'teachingExperiences',
    title: 'Teaching',
    titleFa: 'آموزش',
    editorTab: '06 · Teaching',
    icon: ComposeIcon,
    description: 'Classes, workshops and coaching',
  },
  {
    key: 'upcoming',
    fieldPath: 'upcomingWork',
    title: 'Upcoming',
    titleFa: 'به‌زودی',
    editorTab: '07 · Upcoming',
    icon: RocketIcon,
    description: 'Current and forthcoming work',
  },
  {
    key: 'gallery',
    fieldPath: 'gallery',
    title: 'Gallery',
    titleFa: 'گالری',
    editorTab: '08 · Gallery',
    icon: ImageIcon,
    description: 'Editorial photo gallery',
  },
  {
    key: 'downloads',
    fieldPath: 'downloads',
    title: 'Downloads',
    titleFa: 'دانلودها',
    editorTab: '09 · Downloads',
    icon: LinkIcon,
    description: 'CV and portfolio links',
  },
  {
    key: 'contact',
    fieldPath: 'contact',
    title: 'Contact',
    titleFa: 'تماس',
    editorTab: '10 · Contact',
    icon: EnvelopeIcon,
    description: 'Contact details and call to action',
  },
  {
    key: 'seo',
    fieldPath: 'seo',
    title: 'Search & sharing',
    titleFa: 'جستجو و اشتراک‌گذاری',
    editorTab: 'SEO',
    icon: BlockContentIcon,
    description: 'Google results and social metadata',
  },
]

const DashboardShell = styled(Box)`
  min-height: 100%;
  background:
    radial-gradient(circle at 12% 0%, rgba(177, 70, 106, 0.1), transparent 28rem),
    #fffaf7;
`

const HeroCard = styled(Card)`
  overflow: hidden;
  color: #f8eee8;
  background:
    radial-gradient(circle at 88% 18%, rgba(177, 70, 106, 0.55), transparent 18rem),
    linear-gradient(135deg, #201317 0%, #351b25 100%);
`

const HeroIntentLink = styled(IntentLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.25rem;
  padding: 0 0.8rem;
  border-radius: 0.25rem;
  color: white;
  background: #b1466a;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  transition:
    background 160ms ease,
    transform 160ms ease;

  &:hover,
  &:focus-visible {
    background: #c25478;
    transform: translateY(-1px);
  }
`

const SectionLink = styled(IntentLink)`
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
  outline: none;
`

const SectionCard = styled(Card)`
  height: 100%;
  border: 1px solid rgba(67, 32, 43, 0.09);
  background: rgba(255, 255, 255, 0.94);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  ${SectionLink}:hover &,
  ${SectionLink}:focus-visible & {
    transform: translateY(-3px);
    border-color: rgba(177, 70, 106, 0.45);
    box-shadow: 0 18px 42px rgba(54, 24, 34, 0.12);
  }
`

const NumberMark = styled(Box)`
  width: 2.4rem;
  height: 2.4rem;
  flex: 0 0 2.4rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #f8e9ee;
  color: #983454;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.04em;
`

const ProgressTrack = styled(Box)`
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
`

const ProgressFill = styled(Box)<{$percent: number}>`
  width: ${({$percent}) => `${$percent}%`};
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #d6819d, #f0c994);
  transition: width 280ms ease;
`

function hasContent(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.values(value).some(hasContent)
  return true
}

function hasBothLanguages(value?: LocalizedValue[]) {
  if (!value) return false
  const populatedLanguages = new Set(
    value.filter((item) => hasContent(item.value)).map((item) => item.language),
  )
  return populatedLanguages.has('en') && populatedLanguages.has('fa')
}

function getSectionState(key: SectionKey, data: DashboardData): SectionState {
  const portfolio = data.portfolio
  if (!portfolio) return {ready: false, detail: 'Homepage not found'}

  switch (key) {
    case 'profile':
      return {
        ready:
          hasBothLanguages(portfolio.name) &&
          hasBothLanguages(portfolio.intro) &&
          hasContent(portfolio.headshot),
        detail: `${portfolio.roles?.length ?? 0} roles · EN + FA`,
      }
    case 'resume':
      return {
        ready:
          hasBothLanguages(portfolio.resumeHeading) &&
          hasContent(portfolio.resumeBody) &&
          hasContent(portfolio.education),
        detail: `${portfolio.education?.length ?? 0} education · ${portfolio.skills?.length ?? 0} skills`,
      }
    case 'theatre':
      return {
        ready: data.theatreCount > 0,
        detail: `${data.theatreCount} production${data.theatreCount === 1 ? '' : 's'}`,
      }
    case 'film':
      return {
        ready: data.filmCount > 0,
        detail: `${data.filmCount} production${data.filmCount === 1 ? '' : 's'}`,
      }
    case 'awards':
      return {
        ready: hasContent(portfolio.awards),
        detail: `${portfolio.awards?.length ?? 0} award${portfolio.awards?.length === 1 ? '' : 's'}`,
      }
    case 'teaching':
      return {
        ready: hasContent(portfolio.teachingExperiences),
        detail: `${portfolio.teachingExperiences?.length ?? 0} entr${portfolio.teachingExperiences?.length === 1 ? 'y' : 'ies'}`,
      }
    case 'upcoming':
      return {ready: hasContent(portfolio.upcomingWork), detail: 'Current feature'}
    case 'gallery':
      return {
        ready: hasContent(portfolio.gallery),
        detail: `${portfolio.gallery?.length ?? 0} photo${portfolio.gallery?.length === 1 ? '' : 's'}`,
      }
    case 'downloads':
      return {ready: hasContent(portfolio.downloads), detail: 'CV & portfolio files'}
    case 'contact':
      return {ready: hasContent(portfolio.contact?.email), detail: 'Email & social contact'}
    case 'seo':
      return {ready: hasContent(portfolio.seo), detail: 'Google & social cards'}
    default:
      return {ready: false, detail: 'Needs review'}
  }
}

function LoadingState() {
  return (
    <Card padding={5} radius={3} border>
      <Flex align="center" gap={3}>
        <Spinner muted />
        <Text muted>Reading the current website content…</Text>
      </Flex>
    </Card>
  )
}

export function WebsiteMapTool() {
  const client = useClient({apiVersion: '2026-06-22'})
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setError(null)

    client
      .fetch<DashboardData>(dashboardQuery)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to read website content')
        }
      })

    return () => {
      active = false
    }
  }, [client, refreshKey])

  const sectionStates = useMemo(
    () => (data ? sections.map((section) => getSectionState(section.key, data)) : []),
    [data],
  )
  const readyCount = sectionStates.filter((state) => state.ready).length
  const completionPercent = Math.round((readyCount / sections.length) * 100)

  return (
    <DashboardShell padding={[3, 4, 5]}>
      <Box style={{maxWidth: 1240, margin: '0 auto'}}>
        <Stack space={6}>
          <HeroCard padding={[4, 5, 6]} radius={4} shadow={2}>
            <Grid columns={[1, 1, 2]} gap={6}>
              <Stack space={4}>
                <Badge tone="caution" style={{width: 'fit-content'}}>
                  Portfolio control room
                </Badge>
                <Stack space={3}>
                  <Heading size={4}>The website, in the same order your audience sees it.</Heading>
                  <Text size={2} style={{maxWidth: 630, color: 'rgba(248, 238, 232, 0.72)'}}>
                    Choose a section below, then use the matching numbered tab in the editor. No
                    technical fields, no guessing where content appears.
                  </Text>
                </Stack>
                <Flex align="center" gap={3} wrap="wrap">
                  <HeroIntentLink
                    intent="edit"
                    params={{id: 'portfolioPage', type: 'portfolioPage'}}
                  >
                    <HomeIcon />
                    <span>Edit homepage</span>
                  </HeroIntentLink>
                  <Button
                    as="a"
                    href={defaultWebsiteOrigin}
                    target="_blank"
                    rel="noreferrer"
                    icon={EyeOpenIcon}
                    text="Open website"
                    mode="ghost"
                    style={{color: '#f8eee8'}}
                  />
                </Flex>
              </Stack>

              <Card
                padding={4}
                radius={3}
                style={{background: 'rgba(255,255,255,.075)', color: '#f8eee8'}}
              >
                <Stack space={4}>
                  <Flex align="baseline" justify="space-between">
                    <Stack space={2}>
                      <Text size={1} style={{color: 'rgba(248,238,232,.66)'}}>
                        Website readiness
                      </Text>
                      <Heading size={3}>{data ? `${completionPercent}%` : '—'}</Heading>
                    </Stack>
                    <Text size={1} style={{color: 'rgba(248,238,232,.66)'}}>
                      {data ? `${readyCount} of ${sections.length} sections` : 'Checking content'}
                    </Text>
                  </Flex>
                  <ProgressTrack>
                    <ProgressFill $percent={data ? completionPercent : 0} />
                  </ProgressTrack>
                  <Grid columns={2} gap={3}>
                    <Stack space={2}>
                      <Text size={1} style={{color: 'rgba(248,238,232,.58)'}}>
                        Productions
                      </Text>
                      <Heading size={2}>{data?.productionCount ?? '—'}</Heading>
                    </Stack>
                    <Stack space={2}>
                      <Text size={1} style={{color: 'rgba(248,238,232,.58)'}}>
                        Gallery photos
                      </Text>
                      <Heading size={2}>{data?.portfolio?.gallery?.length ?? '—'}</Heading>
                    </Stack>
                  </Grid>
                </Stack>
              </Card>
            </Grid>
          </HeroCard>

          {error ? (
            <Card padding={4} radius={3} border tone="critical">
              <Flex align="center" justify="space-between" gap={4} wrap="wrap">
                <Stack space={2}>
                  <Text weight="semibold">The content status could not be loaded.</Text>
                  <Text muted size={1}>
                    {error}
                  </Text>
                </Stack>
                <Button icon={RefreshIcon} text="Try again" mode="ghost" onClick={refresh} />
              </Flex>
            </Card>
          ) : !data ? (
            <LoadingState />
          ) : null}

          <Flex align="flex-end" justify="space-between" gap={4} wrap="wrap">
            <Stack space={2}>
              <Text muted size={1} weight="semibold">
                WEBSITE SECTIONS
              </Text>
              <Heading size={3}>Choose what you want to change</Heading>
            </Stack>
            <Flex align="center" gap={2}>
              <Box style={{color: '#b1466a'}}>
                <CheckmarkCircleIcon />
              </Box>
              <Text muted size={1}>
                Status is read from the current dataset
              </Text>
            </Flex>
          </Flex>

          <Grid columns={[1, 1, 2]} gap={4}>
            {sections.map((section, index) => {
              const state = data ? getSectionState(section.key, data) : null
              const Icon = section.icon

              return (
                <SectionLink
                  key={section.key}
                  intent="edit"
                  params={{id: 'portfolioPage', type: 'portfolioPage', path: section.fieldPath}}
                >
                  <SectionCard padding={4} radius={3} shadow={1}>
                    <Stack space={4}>
                      <Flex align="flex-start" gap={3}>
                        <NumberMark>{String(index + 1).padStart(2, '0')}</NumberMark>
                        <Box flex={1}>
                          <Flex align="flex-start" justify="space-between" gap={3}>
                            <Stack space={2}>
                              <Flex align="center" gap={2}>
                                <Box style={{fontSize: 22, color: '#b1466a'}}>
                                  <Icon />
                                </Box>
                                <Heading size={2}>{section.title}</Heading>
                              </Flex>
                              <Text muted size={1} dir="rtl" style={{textAlign: 'left'}}>
                                {section.titleFa}
                              </Text>
                            </Stack>
                            {state ? (
                              <Badge tone={state.ready ? 'positive' : 'caution'}>
                                {state.ready ? 'Ready' : 'Needs attention'}
                              </Badge>
                            ) : null}
                          </Flex>
                        </Box>
                      </Flex>

                      <Stack space={3}>
                        <Text muted size={1}>
                          {section.description}
                        </Text>
                        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                          <Flex align="center" gap={2}>
                            <Badge mode="outline" tone="primary">
                              {section.editorTab}
                            </Badge>
                            <Text muted size={1}>
                              {state?.detail ?? 'Checking…'}
                            </Text>
                          </Flex>
                          <Flex align="center" gap={2} style={{color: '#9d395a'}}>
                            <Text size={1} weight="semibold">
                              Open editor
                            </Text>
                            <ArrowRightIcon />
                          </Flex>
                        </Flex>
                      </Stack>
                    </Stack>
                  </SectionCard>
                </SectionLink>
              )
            })}
          </Grid>

          <Card padding={[4, 5]} radius={3} border style={{background: '#fff1f0'}}>
            <Flex align="flex-start" gap={3}>
              <Box style={{fontSize: 22, color: '#b1466a'}}>
                <WarningOutlineIcon />
              </Box>
              <Stack space={2}>
                <Text weight="semibold">Editing a production?</Text>
                <Text muted size={1}>
                  Open Structure → Productions to edit an individual theatre, film, or television
                  credit. Use the homepage editor only to arrange their order on the website.
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Stack>
      </Box>
    </DashboardShell>
  )
}

export const websiteMapTool: Tool = {
  name: 'website-map',
  title: 'Website map',
  icon: HomeIcon,
  component: WebsiteMapTool,
}
