import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per work in src/content/works/. Optional fields that are empty are not shown.
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
      venue: z.string().default(''),
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
  }),
});

export const collections = { works, writing };
