import {Box, Flex, Text} from '@sanity/ui'
import type {LogoProps} from 'sanity'

export function BrandMark() {
  return (
    <span
      aria-hidden="true"
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at 30% 28%, #ffd8e4 0 24%, transparent 25%), linear-gradient(135deg, #6750a4 0%, #7d5260 48%, #006a6a 100%)',
        border: '1px solid rgba(103, 80, 164, .28)',
        borderRadius: '42% 58% 48% 52%',
        boxShadow: '0 8px 24px rgba(103, 80, 164, .22)',
        color: '#fffbff',
        display: 'inline-flex',
        fontFamily: 'Google Sans, Inter, system-ui, sans-serif',
        fontSize: '.38em',
        fontWeight: 800,
        height: '1em',
        justifyContent: 'center',
        letterSpacing: '-.03em',
        width: '1em',
      }}
    >
      FA
    </span>
  )
}

export function BrandLogo(_props: LogoProps) {
  return (
    <Flex align="center" gap={3} paddingX={1}>
      <Box style={{fontSize: 28, lineHeight: 0}}>
        <BrandMark />
      </Box>
      <Box>
        <Text size={1} weight="semibold">
          Fateme CMS
        </Text>
        <Text muted size={0}>
          Expressive Studio
        </Text>
      </Box>
    </Flex>
  )
}
