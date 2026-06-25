import {DocumentTextIcon, HomeIcon, PlayIcon, ProjectsIcon} from '@sanity/icons'
import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'
import {ContentPlacementView} from '../components/ContentPlacementView'
import {WebsitePreviewView} from '../components/WebsitePreviewView'

const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'https://fatemeabbasi.netlify.app'

// The left navigation reads top-to-bottom as the story of the site: first the
// homepage, then the body of work, then the journal. Every label is bilingual
// (English · فارسی) so the Studio is approachable in either language.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Fateme Abbasi · فاطمه عباسی')
    .items([
      S.listItem()
        .id('portfolioPage')
        .title('1 · Homepage · صفحهٔ اصلی')
        .icon(HomeIcon)
        .child(
          S.document()
            .schemaType('portfolioPage')
            .documentId('portfolioPage')
            .title('Homepage · صفحهٔ اصلی'),
        ),
      S.listItem()
        .title('2 · Productions · کارها')
        .icon(PlayIcon)
        .child(
          S.list()
            .title('Productions · کارها')
            .items([
              S.listItem()
                .title('Theatre & performance · تئاتر و اجرا')
                .icon(PlayIcon)
                .child(
                  S.documentList()
                    .title('Theatre & performance · تئاتر و اجرا')
                    .schemaType('production')
                    .apiVersion('2026-06-22')
                    .filter('_type == "production" && medium in $media')
                    .params({media: ['theatre', 'performance']})
                    .defaultOrdering([{field: '_updatedAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Film & television · فیلم و تلویزیون')
                .icon(ProjectsIcon)
                .child(
                  S.documentList()
                    .title('Film & television · فیلم و تلویزیون')
                    .schemaType('production')
                    .apiVersion('2026-06-22')
                    .filter('_type == "production" && medium in $media')
                    .params({media: ['shortFilm', 'film', 'television']})
                    .defaultOrdering([{field: '_updatedAt', direction: 'desc'}]),
                ),
              S.documentTypeListItem('production')
                .title('All productions · همهٔ کارها')
                .icon(PlayIcon),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('3 · Journal · یادداشت‌ها')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Journal · یادداشت‌ها')
            .items([
              S.documentTypeListItem('post').title('Posts · نوشته‌ها'),
              S.documentTypeListItem('author').title('Authors · نویسندگان'),
              S.documentTypeListItem('category').title('Categories · دسته‌ها'),
            ]),
        ),
    ])

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (!['portfolioPage', 'production', 'post'].includes(schemaType)) {
    return S.document().views([S.view.form()])
  }

  return S.document().views([
    S.view.form().title('Edit content · ویرایش محتوا'),
    S.view.component(ContentPlacementView).title('Where it appears · جای نمایش'),
    S.view
      .component(WebsitePreviewView)
      .options({origin: previewOrigin})
      .title('Published page · صفحهٔ منتشرشده'),
  ])
}
