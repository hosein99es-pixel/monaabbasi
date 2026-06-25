import {defineLive} from 'next-sanity/live'

import {client} from './client'
import {token} from './token'

export const {sanityFetch, SanityLive} = defineLive({
  client,
  browserToken: token ?? false,
  serverToken: token ?? false,
})
