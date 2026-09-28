import { getCollection, type CollectionEntry } from 'astro:content';
export type Work = CollectionEntry<'works'>;
export const getWorks = async () => (await getCollection('works')).sort((a, b) => a.data.order - b.data.order);
