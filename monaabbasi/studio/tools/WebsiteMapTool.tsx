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

const expressive = {
  background: '#fffbff',
  outline: 'rgba(73, 69, 79, .14)',
  primary: '#6750a4',
  primaryContainer: '#eaddff',
  onPrimaryContainer: '#21005d',
  secondaryContainer: '#ffd8e4',
  tertiary: '#006a6a',
  tertiaryContainer: '#b8f3f0',
  warningContainer: '#ffdcc2',
  warningText: '#311300',
}

const DashboardShell = styled(Box)`
  min-height: 100%;
  background:
    radial-gradient(circle at 8% 0%, rgba(234, 221, 255, 0.95), transparent 26rem),
    radial-gradient(circle at 100% 12%, rgba(184, 243, 240, 0.72), transparent 24rem),
    linear-gradient(180deg, #fffbff 0%, #fef7ff 48%, #f7f2fa 100%);
`

const HeroCard = styled(Card)`
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(103, 80, 164, 0.16);
  border-radius: 34px;
  color: #1d1b20;
  background:
    radial-gradient(circle at 88% 18%, rgba(255, 216, 228, 0.95), transparent 19rem),
    radial-gradient(circle at 12% 20%, rgba(234, 221, 255, 0.92), transparent 18rem),
    linear-gradient(135deg, #fffbff 0%, #f7f2fa 62%, #eaddff 100%);

  &::after {
    content: '';
    position: absolute;
    width: 11rem;
    height: 11rem;
    right: -3.5rem;
    bottom: -3rem;
    border-radius: 42% 58% 48% 52%;
    background: linear-gradient(135deg, #6750a4, #006a6a);
    opacity: 0.14;
    transform: rotate(-12deg);
  }
`

const HeroIntentLink = styled(IntentLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 3rem;
  padding: 0 1.15rem;
  border-radius: 999px;
  color: #fffbff;
  background: ${expressive.primary};
  box-shadow: 0 12px 28px rgba(103, 80, 164, 0.22);
  font-size: 0.875rem;
  font-weight: 750;
  line-height: 1;
  text-decoration: none;
  transition:
    background 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  &:hover,
  &:focus-visible {
    background: #7f67be;
    box-shadow: 0 16px 34px rgba(103, 80, 164, 0.28);
    transform: translateY(-2px) scale(1.015);
  }
`

const GhostAction = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 3rem;
  padding: 0 1.05rem;
  border-radius: 999px;
  color: #49454f;
  background: rgba(255, 251, 255, 0.76);
  font-size: 0.875rem;
  font-weight: 750;
  text-decoration: none;
  box-shadow: inset 0 0 0 1px rgba(73, 69, 79, 0.1);

  &:hover,
  &:focus-visible {
    background: #fffbff;
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
  position: relative;
  height: 100%;
  overflow: hidden;
  border: 1px solid ${expressive.outline};
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 251, 255, 0.98), rgba(255, 251, 255, 0.9)),
    #fffbff;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 6px;
    background: linear-gradient(90deg, #6750a4, #7d5260, #006a6a);
    opacity: 0;
    transition: opacity 160ms ease;
  }

  ${SectionLink}:hover &,
  ${SectionLink}:focus-visible & {
    transform: translateY(-4px) scale(1.008);
    border-color: rgba(103, 80, 164, 0.36);
    box-shadow: 0 22px 48px rgba(58, 48, 83, 0.14);
  }

  ${SectionLink}:hover &::before,
  ${SectionLink}:focus-visible &::before {
    opacity: 1;
  }
`

const NumberMark = styled(Box)`
  width: 3.1rem;
  height: 3.1rem;
  flex: 0 0 3.1rem;
  display: grid;
  place-items: center;
  border-radius: 19px;
  background: ${expressive.primaryContainer};
  color: ${expressive.onPrimaryContainer};
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: -0.02em;
`

const SectionIcon = styled(Box)`
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  place-items: center;
  border-radius: 18px;
  color: #21005d;
  background: #eaddff;
`

const StatCard = styled(Card)`
  border: 1px solid rgba(103, 80, 164, 0.12);
  border-radius: 24px;
  background: rgba(255, 251, 255, 0.72);
  color: #1d1b20;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(18px);
`

const ExpressiveBadge = styled(Badge)<{$ready?: boolean}>`
  --card-badge-bg: ${({$ready}) => ($ready ? '#b8f3f0' : '#ffdcc2')};
  color: ${({$ready}) => ($ready ? '#00201f' : expressive.warningText)};
  border-radius: 999px;
  background: var(--card-badge-bg);
  font-weight: 750;
`

const ProgressTrack = styled(Box)`
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(103, 80, 164, 0.12);
`

const ProgressFill = styled(Box)<{$percent: number}>`
  width: ${({$percent}) => `${$percent}%`};
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6750a4, #7d5260, #006a6a);
  transition: width 280ms ease;
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

const GuidanceCard = styled(Card)`
  border: 1px solid rgba(125, 82, 96, 0.18);
  border-radius: 28px;
  background: linear-gradient(135deg, #ffd8e4 0%, #fff8f8 52%, #fffbff 100%);
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
    <StatCard padding={5}>
      <Flex align="center" gap={3}>
        <Spinner muted />
        <Text muted>Reading the current website content…</Text>
      </Flex>
    </StatCard>
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
          <HeroCard padding={[4, 5, 6]} shadow={1}>
            <Grid columns={[1, 1, 2]} gap={6}>
              <Stack space={5}>
                <Kicker size={0}>Expressive control room</Kicker>
                <Stack space={3}>
                  <Heading size={5} style={{maxWidth: 760, letterSpacing: '-.055em', lineHeight: 0.96}}>
                    Edit the portfolio the way the audience experiences it.
                  </Heading>
                  <Text size={2} style={{maxWidth: 660, color: '#625b71', lineHeight: 1.6}}>
                    Choose a section below, then use the matching numbered tab in the editor. No
                    technical fields, no guessing where content appears—just expressive, guided editing.
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
                  <GhostAction
                    href={defaultWebsiteOrigin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <EyeOpenIcon />
                    <span>Open website</span>
                  </GhostAction>
                </Flex>
              </Stack>

              <StatCard padding={4}>
                <Stack space={4}>
                  <Flex align="baseline" justify="space-between">
                    <Stack space={2}>
                      <Text size={1} style={{color: '#625b71'}}>
                        Website readiness
                      </Text>
                      <Heading size={5} style={{letterSpacing: '-.06em'}}>
                        {data ? `${completionPercent}%` : '—'}
                      </Heading>
                    </Stack>
                    <Text size={1} style={{color: '#625b71'}}>
                      {data ? `${readyCount} of ${sections.length} sections` : 'Checking content'}
                    </Text>
                  </Flex>
                  <ProgressTrack>
                    <ProgressFill $percent={data ? completionPercent : 0} />
                  </ProgressTrack>
                  <Grid columns={2} gap={3}>
                    <Card padding={3} style={{borderRadius: 20, background: expressive.primaryContainer}}>
                      <Stack space={2}>
                        <Text size={1} style={{color: '#625b71'}}>
                          Productions
                        </Text>
                        <Heading size={3}>{data?.productionCount ?? '—'}</Heading>
                      </Stack>
                    </Card>
                    <Card padding={3} style={{borderRadius: 20, background: expressive.tertiaryContainer}}>
                      <Stack space={2}>
                        <Text size={1} style={{color: '#625b71'}}>
                          Gallery photos
                        </Text>
                        <Heading size={3}>{data?.portfolio?.gallery?.length ?? '—'}</Heading>
                      </Stack>
                    </Card>
                  </Grid>
                </Stack>
              </StatCard>
            </Grid>
          </HeroCard>

          <Grid columns={[1, 1, 3]} gap={3}>
            <StatCard padding={4}>
              <Stack space={2}>
                <Text muted size={1}>
                  Theatre / performance
                </Text>
                <Heading size={3}>{data?.theatreCount ?? '—'}</Heading>
              </Stack>
            </StatCard>
            <StatCard padding={4}>
              <Stack space={2}>
                <Text muted size={1}>
                  Film / television
                </Text>
                <Heading size={3}>{data?.filmCount ?? '—'}</Heading>
              </Stack>
            </StatCard>
            <StatCard padding={4}>
              <Stack space={2}>
                <Text muted size={1}>
                  Dataset
                </Text>
                <Heading size={3}>migration-test</Heading>
              </Stack>
            </StatCard>
          </Grid>

          {error ? (
            <GuidanceCard padding={4}>
              <Flex align="center" justify="space-between" gap={4} wrap="wrap">
                <Stack space={2}>
                  <Text weight="semibold">The content status could not be loaded.</Text>
                  <Text muted size={1}>
                    {error}
                  </Text>
                </Stack>
                <Button icon={RefreshIcon} text="Try again" mode="ghost" onClick={refresh} />
              </Flex>
            </GuidanceCard>
          ) : !data ? (
            <LoadingState />
          ) : null}

          <Flex align="flex-end" justify="space-between" gap={4} wrap="wrap">
            <Stack space={2}>
              <Kicker size={0}>Website sections</Kicker>
              <Heading size={4} style={{letterSpacing: '-.04em'}}>
                Choose what you want to change
              </Heading>
            </Stack>
            <Flex align="center" gap={2}>
              <Box style={{color: expressive.tertiary}}>
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
                  <SectionCard padding={4} shadow={1}>
                    <Stack space={4}>
                      <Flex align="flex-start" gap={3}>
                        <NumberMark>{String(index + 1).padStart(2, '0')}</NumberMark>
                        <Box flex={1}>
                          <Flex align="flex-start" justify="space-between" gap={3}>
                            <Stack space={2}>
                              <Flex align="center" gap={2}>
                                <SectionIcon style={{fontSize: 22}}>
                                  <Icon />
                                </SectionIcon>
                                <Heading size={3} style={{letterSpacing: '-.035em'}}>
                                  {section.title}
                                </Heading>
                              </Flex>
                              <Text muted size={1} dir="rtl" style={{textAlign: 'left', paddingLeft: 54}}>
                                {section.titleFa}
                              </Text>
                            </Stack>
                            {state ? (
                              <ExpressiveBadge $ready={state.ready}>
                                {state.ready ? 'Ready' : 'Needs attention'}
                              </ExpressiveBadge>
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
                            <Badge mode="outline" tone="primary" style={{borderRadius: 999}}>
                              {section.editorTab}
                            </Badge>
                            <Text muted size={1}>
                              {state?.detail ?? 'Checking…'}
                            </Text>
                          </Flex>
                          <Flex align="center" gap={2} style={{color: expressive.primary}}>
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

          <GuidanceCard padding={[4, 5]}>
            <Flex align="flex-start" gap={3}>
              <SectionIcon
                style={{
                  background: expressive.warningContainer,
                  color: expressive.warningText,
                  fontSize: 22,
                }}
              >
                <WarningOutlineIcon />
              </SectionIcon>
              <Stack space={2}>
                <Text weight="semibold">Editing a production?</Text>
                <Text muted size={1}>
                  Open Structure → Productions to edit an individual theatre, film, or television
                  credit. Use the homepage editor only to arrange their order on the website.
                </Text>
              </Stack>
            </Flex>
          </GuidanceCard>
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
