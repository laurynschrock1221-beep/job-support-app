import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Nutrition Tracker',
  description: 'Log meals, track trends, stay on target.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="bg-slate-950 text-white antialiased min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
