import type {SanityImageObject} from '@sanity/image-url'
import type {PortableTextBlock} from 'next-sanity'

export type BlogImage = SanityImageObject & {
  alt?: string
}

export type BodyImage = BlogImage & {
  _key: string
  _type: 'image'
}

export type Category = {
  _id: string
  title: string
}

export type PostSummary = {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt?: string
  mainImage?: BlogImage
  author?: {name?: string} | null
  categories?: Category[]
}

export type Post = PostSummary & {
  author?: {name?: string; bio?: string; image?: BlogImage} | null
  body?: Array<PortableTextBlock | BodyImage>
}
