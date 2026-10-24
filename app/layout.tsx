import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { CityProvider } from '@/components/providers/CityProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { EventsProvider } from '@/components/providers/EventsProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EventRadar — Hyperlocal Event Discovery',
  description:
    'Discover what is happening around you in real time. Tech hackathons, live music, founder meetups, and urban community gatherings across India.',
  keywords: [
    'EventRadar',
    'Hyperlocal events',
    'Bengaluru tech meetups',
    'Mumbai hackathons',
    'Delhi NCR events',
    'VECNAVERSE',
    'Community discovery',
  ],
  authors: [{ name: 'EventRadar Team' }],
  openGraph: {
    title: 'EventRadar — Hyperlocal Event Discovery',
    description: 'Find, RSVP, and navigate directly to events happening near you.',
    url: 'https://eventradar.local',
    siteName: 'EventRadar',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EventRadar — Hyperlocal Event Discovery',
    description: 'Find, RSVP, and navigate directly to events happening near you.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CityProvider>
              <EventsProvider>
                <Suspense
                  fallback={
                    <header className="sticky top-0 z-40 h-16 w-full apple-glass-nav" />
                  }
                >
                  <Navbar />
                </Suspense>
                <main className="flex-1 w-full">{children}</main>
                <Footer />
                <Toaster richColors position="top-right" />
              </EventsProvider>
            </CityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
