import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

export const presentationResolve: PresentationPluginOptions['resolve'] = {
  locations: {
    portfolioPage: defineLocations({
      select: {title: 'name.0.value'},
      resolve: (document) => ({
        locations: [
          {title: document?.title || 'Portfolio homepage', href: '/en#profile'},
          {title: 'Resume', href: '/en#resume'},
          {title: 'Theatre', href: '/en#theatre'},
          {title: 'Film & TV', href: '/en#film'},
          {title: 'Awards', href: '/en#awards'},
          {title: 'Teaching', href: '/en#teaching'},
          {title: 'Upcoming', href: '/en#upcoming'},
          {title: 'Gallery', href: '/en#gallery'},
          {title: 'Downloads', href: '/en#downloads'},
          {title: 'Contact', href: '/en#contact'},
        ],
      }),
    }),
    production: defineLocations({
      select: {medium: 'medium', title: 'title.0.value'},
      resolve: (document) => ({
        locations: [
          {
            title: document?.title || 'Production',
            href: ['film', 'shortFilm', 'television'].includes(document?.medium ?? '')
              ? '/en#film'
              : '/en#theatre',
          },
        ],
      }),
    }),
    post: defineLocations({
      select: {slug: 'slug.current', title: 'title'},
      resolve: (document) => ({
        locations: document?.slug
          ? [
              {title: document.title || 'Post', href: `/en#journal-${document.slug}`},
            ]
          : [],
      }),
    }),
  },
}
