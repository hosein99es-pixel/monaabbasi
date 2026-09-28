import { NAME, SHORT_NAME, DESCRIPTION, EMAIL, LINKEDIN, INSTAGRAM, TELEGRAM } from '../consts';

/** schema.org Person, used on the home and About pages and as creator on works. */
export const person = (site: URL) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': new URL('/#person', site).href,
  name: NAME,
  alternateName: SHORT_NAME,
  url: site.href,
  description: DESCRIPTION,
  jobTitle: 'Theatre Director',
  email: `mailto:${EMAIL}`,
  sameAs: [LINKEDIN, INSTAGRAM, TELEGRAM],
  address: { '@type': 'PostalAddress', addressLocality: 'Tehran', addressCountry: 'IR' },
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Tehran University of Art' },
    { '@type': 'CollegeOrUniversity', name: 'Shahid Beheshti University' },
  ],
  knowsAbout: ['Theatre directing', 'Scenography', 'Theatre production', 'Postdramatic theatre', 'Intermediality'],
});
