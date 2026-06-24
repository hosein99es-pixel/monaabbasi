import {defineQuery} from 'next-sanity'

export const PORTFOLIO_QUERY = defineQuery(`
  *[_id == "portfolioPage"][0] {
    _id,
    "name": coalesce(name[language == $locale][0].value, name[language == "en"][0].value),
    "intro": coalesce(intro[language == $locale][0].value, intro[language == "en"][0].value),
    headshot {
      crop,
      hotspot,
      "alt": coalesce(alt[language == $locale][0].value, alt[language == "en"][0].value),
      asset->{_id, url, metadata{lqip, dimensions{width, height, aspectRatio}}}
    },
    roles[]{_key, "label": coalesce(label[language == $locale][0].value, label[language == "en"][0].value)},
    "resumeHeading": coalesce(resumeHeading[language == $locale][0].value, resumeHeading[language == "en"][0].value),
    "resumeBody": coalesce(resumeBody[language == $locale][0].value, resumeBody[language == "en"][0].value),
    resumeImage {
      crop,
      hotspot,
      "alt": coalesce(alt[language == $locale][0].value, alt[language == "en"][0].value),
      asset->{_id, url, metadata{lqip, dimensions{width, height, aspectRatio}}}
    },
    education[]{
      _key,
      "qualification": coalesce(qualification[language == $locale][0].value, qualification[language == "en"][0].value),
      "institution": coalesce(institution[language == $locale][0].value, institution[language == "en"][0].value),
      "description": coalesce(description[language == $locale][0].value, description[language == "en"][0].value)
    },
    skills[]{
      _key,
      "category": coalesce(category[language == $locale][0].value, category[language == "en"][0].value),
      "title": coalesce(title[language == $locale][0].value, title[language == "en"][0].value),
      "description": coalesce(description[language == $locale][0].value, description[language == "en"][0].value)
    },
    sectionIntroductions[]{
      _key,
      section,
      "label": coalesce(label[language == $locale][0].value, label[language == "en"][0].value),
      "heading": coalesce(heading[language == $locale][0].value, heading[language == "en"][0].value),
      "body": coalesce(body[language == $locale][0].value, body[language == "en"][0].value)
    },
    productions[]->{
      _id,
      "slug": slug.current,
      medium,
      "title": coalesce(title[language == $locale][0].value, title[language == "en"][0].value),
      "year": coalesce(yearDisplay[language == $locale][0].value, yearDisplay[language == "en"][0].value),
      "role": coalesce(role[language == $locale][0].value, role[language == "en"][0].value),
      "director": coalesce(director[language == $locale][0].value, director[language == "en"][0].value),
      "venue": coalesce(venue[language == $locale][0].value, venue[language == "en"][0].value),
      "summary": coalesce(summary[language == $locale][0].value, summary[language == "en"][0].value),
      heroImage {
        crop,
        hotspot,
        "alt": coalesce(alt[language == $locale][0].value, alt[language == "en"][0].value),
        asset->{_id, url, metadata{lqip, dimensions{width, height, aspectRatio}}}
      }
    },
    awards[]{
      _key,
      "title": coalesce(title[language == $locale][0].value, title[language == "en"][0].value),
      "description": coalesce(description[language == $locale][0].value, description[language == "en"][0].value)
    },
    teachingExperiences[]{
      _key,
      "title": coalesce(title[language == $locale][0].value, title[language == "en"][0].value),
      "description": coalesce(description[language == $locale][0].value, description[language == "en"][0].value)
    },
    upcomingWork {
      "title": coalesce(title[language == $locale][0].value, title[language == "en"][0].value),
      "description": coalesce(description[language == $locale][0].value, description[language == "en"][0].value),
      image {
        crop,
        hotspot,
        "alt": coalesce(alt[language == $locale][0].value, alt[language == "en"][0].value),
        asset->{_id, url, metadata{lqip, dimensions{width, height, aspectRatio}}}
      }
    },
    gallery[]{
      _key,
      "label": coalesce(label[language == $locale][0].value, label[language == "en"][0].value),
      "title": coalesce(title[language == $locale][0].value, title[language == "en"][0].value),
      "caption": coalesce(caption[language == $locale][0].value, caption[language == "en"][0].value),
      image {
        crop,
        hotspot,
        "alt": coalesce(alt[language == $locale][0].value, alt[language == "en"][0].value),
        asset->{_id, url, metadata{lqip, dimensions{width, height, aspectRatio}}}
      }
    },
    contact {
      "heading": coalesce(heading[language == $locale][0].value, heading[language == "en"][0].value),
      "description": coalesce(description[language == $locale][0].value, description[language == "en"][0].value),
      email,
      phone,
      whatsappUrl
    },
    downloads {
      portfolioFile {asset->{_id, url, originalFilename}},
      resumeFile {asset->{_id, url, originalFilename}}
    },
    seo {
      "title": coalesce(title[language == $locale][0].value, title[language == "en"][0].value),
      "description": coalesce(description[language == $locale][0].value, description[language == "en"][0].value)
    },
    "footerText": coalesce(footerText[language == $locale][0].value, footerText[language == "en"][0].value)
  }
`)

export const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)]
  | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    mainImage {asset, alt, crop, hotspot},
    "author": author->{name},
    "categories": categories[]->{_id, title}
  }
`)

export const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    mainImage {asset, alt, crop, hotspot},
    "author": author->{name, bio, image {asset, alt, crop, hotspot}},
    "categories": categories[]->{_id, title},
    body[]
  }
`)
