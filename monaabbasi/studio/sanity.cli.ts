import {defineCliConfig} from 'sanity/cli'

const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineCliConfig({
  api: {
    projectId: 'esf8v11h',
    dataset,
  },
  typegen: {
    path: '../web/src/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
  deployment: {
    /**
     * Auto-updates OFF: the Studio is bundled fully self-contained and served
     * from our own Netlify origin, instead of fetching core modules from
     * sanity-cdn.com at runtime. That runtime fetch was the cause of the
     * intermittent blank page on mobile networks. With it off, /admin loads
     * deterministically from one origin (and the "Forbidden"/appId warning at
     * build time goes away too). To pick up a newer Sanity version, just
     * rebuild and redeploy.
     */
    autoUpdates: false,
  },
})
