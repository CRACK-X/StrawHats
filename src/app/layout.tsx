import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#020617',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Straw Hats Robotics | Underwater ROV Competition Team',
    template: '%s | Straw Hats Robotics',
  },
  description:
    'Straw Hats Robotics is a student robotics team competing in ROV and underwater robotics competitions, including MATE ROV. We design and build remotely operated vehicles to solve real-world engineering challenges.',
  keywords: [
    'robotics',
    'ROV',
    'underwater robotics',
    'student team',
    'competition',
    'MATE ROV',
    'remotely operated vehicle',
    'engineering',
    'STEM',
    'robotics club',
    'underwater vehicle',
    'ROV competition',
    'student robotics team',
  ],
  authors: [{ name: 'Straw Hats Robotics' }],
  creator: 'Straw Hats Robotics',
  publisher: 'Straw Hats Robotics',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Straw Hats Robotics',
    title: 'Straw Hats Robotics | Underwater ROV Competition Team',
    description:
      'Student robotics team competing in ROV and underwater robotics competitions, including MATE ROV. Design, build, and compete with remotely operated vehicles.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Straw Hats Robotics - Underwater ROV Competition Team',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Straw Hats Robotics | Underwater ROV Competition Team',
    description:
      'Student robotics team competing in ROV and underwater robotics competitions, including MATE ROV.',
    images: ['/og-image.png'],
    creator: '@strawhatsrobotics',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/New_LOGO.png',
    apple: '/New_LOGO.png',
  },
  manifest: '/site.webmanifest',
  referrer: 'origin-when-cross-origin',
  category: 'education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Straw Hats Robotics',
    url: siteUrl,
    logo: `${siteUrl}/New_LOGO.png`,
    description:
      'Student robotics team competing in ROV and underwater robotics competitions, including MATE ROV.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    knowsAbout: [
      'ROV',
      'Underwater Robotics',
      'MATE ROV Competition',
      'Remotely Operated Vehicles',
      'STEM Education',
    ],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Straw Hats Robotics',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="application-name" content="Straw Hats Robotics" />
        <meta name="theme-color" content="#020617" />
        <meta name="msapplication-TileColor" content="#020617" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
