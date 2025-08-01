import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { InteractiveGridPattern } from '@/components/magicui/interactive-grid-pattern'
import { Toaster } from '@/components/ui/toaster'
import { FlickeringGrid } from '@/components/magicui/flickering-grid'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DesignOps - CRM Financeiro para Designers',
  description: 'Gerencie seus projetos, clientes e finanças em um só lugar',
  icons: {
    icon: '/iconpage-designops.png',
    shortcut: '/iconpage-designops.png',
    apple: '/iconpage-designops.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="fixed inset-0 -z-10">
          <FlickeringGrid
            className="w-full h-full opacity-70 dark:opacity-30"
            squareSize={4}
            gridGap={6}
            color="#334155"
            maxOpacity={0.5}
            flickerChance={0.10}
          />
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}