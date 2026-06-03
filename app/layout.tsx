import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zovo — Music Career Platform',
  description: 'The all-in-one platform for independent music artists.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
