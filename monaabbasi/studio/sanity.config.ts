import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {BrandLogo, BrandMark} from './components/BrandLogo'
import {PortableTextPlugins} from './components/PortableTextPlugins'
import {StudioLayout} from './components/StudioLayout'
import {StudioNavbar} from './components/StudioNavbar'
import {EditorialStatusBadge} from './document/badges'
import {OpenWebsiteAction, TranslationChecklistAction} from './document/actions'
import {presentationResolve} from './presentation/resolve'
import {schemaTypes} from './schemaTypes'
import {defaultDocumentNode, structure} from './structure'
import {monaStudioTheme} from './theme'
import {websiteMapTool} from './tools/WebsiteMapTool'

const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'https://monaabbasi.netlify.app'
const enablePresentationTool = process.env.SANITY_STUDIO_ENABLE_PRESENTATION === 'true'
const hiddenEditorTools = new Set(['vision', 'releases'])

export default defineConfig({
  name: 'default',
  title: 'Fateme Abbasi · Portfolio Studio',
  icon: BrandMark,

  projectId: 'esf8v11h',
  dataset,

  // Served as a static build under https://<site>/admin on the same Netlify site.
  basePath: '/admin',

  plugins: [
    structureTool({structure, defaultDocumentNode}),
    ...(enablePresentationTool
      ? [
          presentationTool({
            title: 'Preview',
            previewUrl: {
              initial: `${previewOrigin}/en`,
              previewMode: {
                enable: '/api/draft-mode/enable',
              },
            },
            resolve: presentationResolve,
          }),
        ]
      : []),
  ],

  tools: (previousTools) => [
    websiteMapTool,
    ...previousTools.filter((tool) => !hiddenEditorTools.has(tool.name)),
  ],

  theme: monaStudioTheme,

  studio: {
    components: {logo: BrandLogo, layout: StudioLayout, navbar: StudioNavbar},
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

      // Keep the default actions FIRST so "Publish" stays the primary button in
      // the document footer; the custom actions follow it (into the "…" menu).
      return ['portfolioPage', 'production', 'post'].includes(context.schemaType)
        ? [
            ...actions,
            OpenWebsiteAction,
            ...(['portfolioPage', 'production'].includes(context.schemaType)
              ? [TranslationChecklistAction]
              : []),
          ]
        : actions
    },
    badges: (previousBadges) => [...previousBadges, EditorialStatusBadge],
  },

  schema: {
    types: schemaTypes,
  },
})
