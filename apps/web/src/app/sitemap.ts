import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://helpsathi.com';

  // Core public routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/pricing',
    '/categories',
    '/mentors',
    '/terms',
    '/privacy',
    '/refund'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Fetch all public mentor profiles
  const mentors = await prisma.mentorProfile.findMany({
    where: { status: "APPROVED" },
    select: {
      username: true,
      id: true,
      updatedAt: true,
    }
  });

  const mentorRoutes = mentors.map((mentor) => ({
    url: `${baseUrl}/mentors/${mentor.username || mentor.id}`,
    lastModified: mentor.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [...routes, ...mentorRoutes];
}
