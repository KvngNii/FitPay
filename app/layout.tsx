import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SplashScreen from '@/components/SplashScreen'
import { APPLE_SPLASH } from '@/lib/appleSplash'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FitPay',
  description: 'Session management and payments for personal trainers in Ghana',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitPay',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0fdc82',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {APPLE_SPLASH.map((s) => (
          <link
            key={s.file}
            rel="apple-touch-startup-image"
            href={`/icons/splash/${s.file}`}
            media={`screen and (device-width: ${s.w}px) and (device-height: ${s.h}px) and (-webkit-device-pixel-ratio: ${s.r}) and (orientation: portrait)`}
          />
        ))}
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-50`}>
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}
