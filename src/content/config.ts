import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
    canonical: z.string().url().optional()
  })
});

const courses = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    price: z.number().nonnegative().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    duration: z.string().optional(),
    heroImage: z.string().optional(),
    outline: z.array(z.string()).default([]),
    paymentLink: z.string().url().optional(),
    draft: z.boolean().default(false),
  })
});

const trainings = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    duration: z.string().optional(),
    mode: z.enum(['remote', 'in-person', 'hybrid']).optional(),
    schedule: z.string().optional(),
    heroImage: z.string().optional(),
    outline: z.array(z.string()).default([]),
    calendlyLink: z.string().url().optional(),
    draft: z.boolean().default(false),
  })
});

export const collections = { articles, courses, trainings };