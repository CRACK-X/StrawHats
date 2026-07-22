import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SuppressWarnings from '@/components/SuppressWarnings';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Straw Hats Robotics | Underwater Robotics Team',
  description: 'Straw Hats Robotics is a student robotics team competing in ROV and underwater robotics competitions, including MATE ROV.',
  keywords: ['robotics', 'ROV', 'underwater robotics', 'student team', 'competition', 'MATE ROV'],
  authors: [{ name: 'Straw Hats Robotics' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://strawhatsrobotics.com',
    siteName: 'Straw Hats Robotics',
    title: 'Straw Hats Robotics | Underwater Robotics Team',
    description: 'Straw Hats Robotics is a student robotics team competing in ROV and underwater robotics competitions.',
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
    title: 'Straw Hats Robotics | Underwater Robotics Team',
    description: 'Straw Hats Robotics is a student robotics team competing in ROV and underwater robotics competitions.',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <SuppressWarnings />
        {children}
      </body>
    </html>
  );
}
