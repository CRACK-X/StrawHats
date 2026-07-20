import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Straw Hats Robotics | MATE ROV Competition Team',
  description: 'Straw Hats Robotics is a student robotics team competing annually in the MATE ROV Competition, designing, building, and piloting remotely operated underwater vehicles.',
  keywords: ['robotics', 'MATE ROV', 'underwater robotics', 'student team', 'competition'],
  authors: [{ name: 'Straw Hats Robotics' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://strawhatsrobotics.com',
    siteName: 'Straw Hats Robotics',
    title: 'Straw Hats Robotics | MATE ROV Competition Team',
    description: 'Straw Hats Robotics is a student robotics team competing annually in the MATE ROV Competition.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Straw Hats Robotics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Straw Hats Robotics | MATE ROV Competition Team',
    description: 'Straw Hats Robotics is a student robotics team competing annually in the MATE ROV Competition.',
    images: ['/og-image.png'],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self';" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
