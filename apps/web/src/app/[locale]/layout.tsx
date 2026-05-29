import { Toaster } from '@/components/ui/toaster';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';

import '../../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'HRMS', template: '%s | HRMS' },
  description: 'Enterprise Human Resource Management System',
  robots: { index: false, follow: false },
};

const locales = ['en-US', 'en-GB', 'en-IN', 'hi-IN', 'ar-SA', 'de-DE', 'fr-FR'] as const;
type Locale = (typeof locales)[number];

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === 'ar-SA' ? 'rtl' : 'ltr'}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
