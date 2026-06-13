import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const headingSerif = Playfair_Display({
  variable: '--font-heading-serif',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'White-C — Gifting Solutions',
  description:
    'Discover curated corporate gifts by budget, occasion, recipient, and branding needs. Inquiry-first gifting by white-c for teams, clients, events, and festive campaigns.',
  icons: {
    icon: [
      {
        url: '/brand/whitec-mark.png?v=10',
        type: 'image/png',
      },
    ],
    shortcut: '/brand/whitec-mark.png?v=10',
    apple: '/brand/whitec-mark.png?v=10',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${headingSerif.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}