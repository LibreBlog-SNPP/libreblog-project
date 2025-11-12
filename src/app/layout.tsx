import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NotificationPopup from '@/components/notifications/NotificationPopup'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'LibreBlog - Tu espacio de expresión libre',
  description: 'Comparte tus ideas, historias y conocimientos con el mundo',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Obtener datos del usuario desde la base de datos si está autenticado
  let user = null
  if (authUser) {
    try {
      user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      })
      
      // Si no existe el usuario en la BD, crearlo automáticamente
      if (!user) {
        console.log('Usuario no encontrado en BD, creando automáticamente...')
        const username = (authUser.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '')
        user = await prisma.user.create({
          data: {
            id: authUser.id,
            email: authUser.email || '',
            username: username,
            displayName: authUser.user_metadata?.display_name || null,
            avatarUrl: authUser.user_metadata?.avatar_url || null,
          },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        })
      }
    } catch (error) {
      console.error('Error obteniendo/creando usuario:', error)
      // En caso de error, usar datos básicos del auth
      user = {
        id: authUser.id,
        email: authUser.email || '',
        displayName: authUser.user_metadata?.display_name || null,
        avatarUrl: authUser.user_metadata?.avatar_url || null,
      }
    }
  }

  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="flex flex-col min-h-screen">
          <Navbar user={user} />
          <main className="flex-grow bg-gray-50">{children}</main>
          <Footer />
        </div>
        {user && <NotificationPopup />}
      </body>
    </html>
  )
}