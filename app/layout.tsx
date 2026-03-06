import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { LeadsProvider } from '@/components/leads-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Signal CRM',
  description: 'B2B Lead Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('crm-theme');var d=t==='dark';document.documentElement.setAttribute('data-theme',d?'dark':'light');if(d)document.documentElement.classList.add('dark');})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <LeadsProvider>{children}</LeadsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
