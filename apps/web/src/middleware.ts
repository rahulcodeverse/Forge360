import createMiddleware from 'next-intl/middleware';

const locales = ['en-US', 'en-GB', 'en-IN', 'hi-IN', 'ar-SA', 'de-DE', 'fr-FR'] as const;

export default createMiddleware({
  locales,
  defaultLocale: 'en-US',
  localePrefix: 'always',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
