import {DocumentTextIcon, HomeIcon, PlayIcon, ProjectsIcon} from '@sanity/icons'
import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'
import {ContentPlacementView} from '../components/ContentPlacementView'
import {WebsitePreviewView} from '../components/WebsitePreviewView'

const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3000'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Fateme Abbasi website')
    .items([
      S.listItem()
        .title('Portfolio homepage')
        .icon(HomeIcon)
        .child(
          S.document()
            .schemaType('portfolioPage')
            .documentId('portfolioPage')
            .title('Portfolio homepage'),
        ),
      S.listItem()
        .title('Productions')
        .icon(PlayIcon)
        .child(
          S.list()
            .title('Productions')
            .items([
              S.listItem()
                .title('Theatre & performance')
                .icon(PlayIcon)
                .child(
                  S.documentList()
                    .title('Theatre & performance')
                    .schemaType('production')
                    .filter('_type == "production" && medium in $media')
                    .params({media: ['theatre', 'performance']})
                    .defaultOrdering([{field: '_updatedAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Film & television')
                .icon(ProjectsIcon)
                .child(
                  S.documentList()
                    .title('Film & television')
                    .schemaType('production')
                    .filter('_type == "production" && medium in $media')
                    .params({media: ['shortFilm', 'film', 'television']})
                    .defaultOrdering([{field: '_updatedAt', direction: 'desc'}]),
                ),
              S.documentTypeListItem('production').title('All productions').icon(PlayIcon),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Journal')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Journal')
            .items([
              S.documentTypeListItem('post').title('Posts'),
              S.documentTypeListItem('author').title('Authors'),
              S.documentTypeListItem('category').title('Categories'),
            ]),
        ),
    ])

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (!['portfolioPage', 'production', 'post'].includes(schemaType)) {
    return S.document().views([S.view.form()])
  }

  return S.document().views([
    S.view.form().title('Edit content'),
    S.view.component(ContentPlacementView).title('Where it appears'),
    S.view.component(WebsitePreviewView).options({origin: previewOrigin}).title('Published website'),
  ])
}
