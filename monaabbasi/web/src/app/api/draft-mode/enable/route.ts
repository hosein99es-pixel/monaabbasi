import {defineEnableDraftMode} from 'next-sanity/draft-mode'

import {client} from '@/sanity/client'
import {token} from '@/sanity/token'

const missingTokenResponse =
  'Missing SANITY_API_READ_TOKEN. Add a Viewer token to web/.env.local, restart next dev, then reopen Sanity Presentation.'

export const {GET} = token
  ? defineEnableDraftMode({
      client: client.withConfig({token}),
    })
  : {
      GET() {
        return new Response(missingTokenResponse, {status: 500})
      },
    }
