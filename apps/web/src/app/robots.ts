import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/dashboard/*',
        '/admin',
        '/admin/*',
        '/mentor-dashboard',
        '/mentor-dashboard/*',
        '/api/*',
        '/onboarding',
        '/wallet',
        '/chats/*',
        '/book-call/*',
      ],
    },
    sitemap: 'https://helpsathi.com/sitemap.xml',
  };
}
