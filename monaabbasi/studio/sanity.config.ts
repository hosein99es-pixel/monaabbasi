import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {BrandLogo, BrandMark} from './components/BrandLogo'
import {PortableTextPlugins} from './components/PortableTextPlugins'
import {EditorialStatusBadge} from './document/badges'
import {OpenWebsiteAction, TranslationChecklistAction} from './document/actions'
import {presentationResolve} from './presentation/resolve'
import {schemaTypes} from './schemaTypes'
import {defaultDocumentNode, structure} from './structure'
import {monaStudioTheme} from './theme'
import {websiteMapTool} from './tools/WebsiteMapTool'

const dataset = process.env.SANITY_STUDIO_DATASET || 'migration-test'
const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3000'

export default defineConfig({
  name: 'default',
  title: 'Fateme Abbasi · Portfolio Studio',
  icon: BrandMark,

  projectId: 'esf8v11h',
  dataset,

  plugins: [
    structureTool({structure, defaultDocumentNode}),
    presentationTool({
      title: 'Live preview',
      previewUrl: {
        initial: `${previewOrigin}/en`,
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
      resolve: presentationResolve,
    }),
    visionTool({defaultApiVersion: '2026-06-22'}),
  ],

  tools: (previousTools) => [websiteMapTool, ...previousTools],

  theme: monaStudioTheme,

  studio: {
    components: {logo: BrandLogo},
  },

  form: {
    components: {
      portableText: {plugins: PortableTextPlugins},
    },
  },

  document: {
    actions: (previousActions, context) => {
      const actions =
        context.schemaType === 'portfolioPage'
          ? previousActions.filter(
              (action) => action.action !== 'delete' && action.action !== 'duplicate',
            )
          : previousActions

      return ['portfolioPage', 'production', 'post'].includes(context.schemaType)
        ? [
            OpenWebsiteAction,
            ...(['portfolioPage', 'production'].includes(context.schemaType)
              ? [TranslationChecklistAction]
              : []),
            ...actions,
          ]
        : actions
    },
    badges: (previousBadges) => [...previousBadges, EditorialStatusBadge],
  },

  schema: {
    types: schemaTypes,
  },
})
