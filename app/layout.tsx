import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stack Builder',
  description: 'Minimal full-stack app builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <a href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              Stack Builder
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
