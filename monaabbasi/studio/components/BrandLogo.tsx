import {Box, Flex, Text} from '@sanity/ui'
import type {LogoProps} from 'sanity'

export function BrandMark() {
  return (
    <span
      aria-hidden="true"
      style={{
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1b1115, #3a1c28)',
        border: '1px solid #b1466a',
        borderRadius: '35%',
        color: '#eac480',
        display: 'inline-flex',
        fontFamily: 'Georgia, serif',
        fontSize: '.38em',
        fontWeight: 700,
        height: '1em',
        justifyContent: 'center',
        letterSpacing: '.03em',
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
          Fateme Abbasi
        </Text>
        <Text muted size={0}>
          Portfolio Studio
        </Text>
      </Box>
    </Flex>
  )
}
