import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId, studioUrl} from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  perspective: 'published',
  stega: {
    studioUrl,
  },
  useCdn: true,
})
