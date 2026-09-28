import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: ({ image }) => {
    const pic = z.object({ src: image(), alt: z.string(), caption: z.string().optional() });
    return z.object({
      title: z.string(),
      order: z.number(),
      year: z.number(),
      month: z.string().optional(),
      status: z.string().optional(),
      venue: z.string(),
      city: z.string(),
      roles: z.array(z.string()),
      category: z.array(z.enum(['theatre', 'video-mapping', 'dramaturgy', 'scenography'])),
      author: z.string().default(''),
      duration: z.string().default(''),
      summary: z.string(),
      credits: z.array(z.object({ role: z.string(), name: z.string() })).default([]),
      cover: pic,
      gallery: z.array(pic).default([]),
      archive: z.array(pic).default([]),
      video_url: z.string().default(''),
      brochure_pdf: z.string().default(''),
      press: z
        .array(
          z.object({
            source: z.string(),
            title: z.string().optional(),
            date: z.string().optional(),
            url: z.string().optional(),
            quote: z.string().optional(),
          }),
        )
        .default([]),
      draft_translation: z.array(z.string()).default([]),
    });
  },
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    type: z.string(),
    year: z.union([z.number(), z.string()]),
    institution: z.string().optional(),
    advisors: z.string().optional(),
    coauthors: z.string().optional(),
    status: z.string().optional(),
    pdf: z.string().default(''),
    related_work: z.string().optional(),
  }),
});

export const collections = { works, writing };
