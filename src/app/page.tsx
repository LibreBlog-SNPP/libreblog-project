import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { PenSquare, Search, Users, Sparkles, TrendingUp, Shield, Heart, TrendingUpIcon } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getAvatarUrl, extractExcerpt } from '@/lib/utils'
import NSFWFilter from '@/components/ui/NSFWFilter'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let currentUserNSFWProtection = true
  let blockedUsers: string[] = []
  if (authUser) {
    try {
      const userPrefs = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { nsfwProtection: true, blockedUsers: true }
      })
      currentUserNSFWProtection = userPrefs?.nsfwProtection ?? true
      blockedUsers = userPrefs?.blockedUsers || []
    } catch {}
  }

  // Obtener estadísticas
  const [totalPosts, totalUsers, totalCategories] = await Promise.all([
    prisma.post.count({ where: { isPublic: true } }),
    prisma.user.count(),
    prisma.category.count(),
  ])

  // Obtener posts más populares
  const allPosts = await prisma.post.findMany({
    where: { isPublic: true },
    include: {
      author: true,
      category: true
    }
  })

  // Contar likes por post
  const likeCounts = await prisma.like.groupBy({
    by: ['postId'],
    _count: { postId: true }
  })

  const likeMap = Object.fromEntries(
    likeCounts.map(l => [l.postId, l._count.postId])
  )

  const postsWithLikes = allPosts.map(post => ({
    ...post,
    _count: { likes: likeMap[post.id] || 0 }
  }))

  const topPosts = postsWithLikes
    .sort((a, b) => b._count.likes - a._count.likes)
    .slice(0, 6)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#000022] via-[#0c2b4d] to-[#36234e] text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
          <div className="text-center space-y-8 animate-fadeIn">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <svg width="120" height="120" viewBox="0 0 512 512" className="relative z-10 group-hover:scale-105 transition-all duration-500">
                  <defs>
                    <linearGradient id="heroLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#dedff1" />
                      <stop offset="50%" stopColor="#5f638f" />
                      <stop offset="100%" stopColor="#dedff1" />
                    </linearGradient>
                    <filter id="heroGlow">
                      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/> 
                      </feMerge>
                    </filter>
                  </defs>
                  <g transform="translate(0,512) scale(0.1,-0.1)" fill="url(#heroLogoGradient)" filter="url(#heroGlow)" className="group-hover:opacity-90 transition-opacity">
                    <path d="M4655 4661c121-121 222-221 224-221 9 0-9 128-24 170-51 145-190 247-362 266l-58 6 220-221z"/>
                    <path d="M3140 3753c-663-569-1207-1039-1209-1045-3-10 807-828 821-828 5 0 468 537 1029 1193 562 655 1029 1200 1037 1210 15 17 0 34-229 261l-244 244-1205-1035z"/>
                    <path d="M1446 2053l-368-536 243-243 244-244 538 372 538 371-408 409c-224 224-410 408-413 407-3 0-171-241-374-536z"/>
                    <path d="M823 1181l-262-196-6-45c-39-279-128-497-267-655l-42-48 41 26c76 48 218 116 298 142 119 40 200 55 301 55l91 0 219 285c120 156 220 290 222 297 1 8-73 86-166 175l-168 161-261-197zm43-360c101-62 29-217-83-180-108 35-83 195 32 198 11 1 34-8 51-18z"/>
                  </g>
                </svg>
              </div>
            </div>
            
            <div className="inline-flex items-center space-x-2 bg-[#dedff1]/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Bienvenido a LibreBlog</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
              Tu espacio de
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#dedff1] to-[#5f638f]">
                expresión libre
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-[#dedff1]/90 max-w-3xl mx-auto px-4">
              Comparte tus ideas, historias y conocimientos con el mundo. 
              Escribe en Markdown, conecta con otros escritores y crece tu audiencia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/register">
                <Button size="lg" variant="primary" className="shadow-2xl shadow-blue-500/50 px-8">
                  Comenzar Gratis
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8">
                  Explorar Posts
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto pt-12">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{totalPosts}+</div>
                <div className="text-[#dedff1]/80 text-xs sm:text-sm md:text-base">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{totalUsers}+</div>
                <div className="text-[#dedff1]/80 text-xs sm:text-sm md:text-base">Escritores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{totalCategories}</div>
                <div className="text-[#dedff1]/80 text-xs sm:text-sm md:text-base">Categorías</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249 250 251)"/>
          </svg>
        </div>
      </section>

      {topPosts.length > 0 && (
        <section className="bg-gradient-to-br from-[#dedff1] via-[#dedff1]/80 to-[#dedff1]/60">
          {/* Wave decoration top */}
          <div className="w-full">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rotate-180">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249 250 251)"/>
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5f638f]/20 to-[#36234e]/20 px-5 py-2.5 rounded-full mb-4 shadow-lg">
                <TrendingUpIcon className="w-5 h-5 text-[#0c2b4d]" />
                <span className="text-sm font-bold text-[#000022]">Más Populares</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0c2b4d] via-[#36234e] to-[#5f638f] bg-clip-text text-transparent mb-3 flex items-center justify-center gap-3">
                <Heart className="w-10 h-10 text-red-500 fill-current animate-pulse" />
                Posts con Más Likes
              </h2>
              <p className="text-lg text-[#000022]/80">Los posts más queridos por la comunidad</p>
            </div>
            
            {/* Post #1 - Destacado estilo tarjeta Pokémon */}
            {topPosts[0] && (() => {
            const post = topPosts[0]
            const authorAvatarUrl = getAvatarUrl(post.author.email, post.author.avatarUrl, 40)
            const excerpt = extractExcerpt(post.content, 120)
            const shouldFilter = !!(authUser && post.isNSFW && currentUserNSFWProtection)
            const isBlocked = authUser && blockedUsers.includes(post.author.id)

            return (
            <div className="block mb-10">
                {authUser ? (
                  <NSFWFilter
                    isNSFW={shouldFilter}
                    authorId={post.author.id}
                    blockedUsers={blockedUsers}
                  >
                    <Link href={`/post/${post.slug}`} className="block">
                    <div className="relative max-w-sm mx-auto perspective-1000">
                    <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-400 p-1 rounded-3xl shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 group">
                      <div className="bg-gradient-to-br from-yellow-50 to-white rounded-3xl overflow-hidden">
                        {/* Borde decorativo superior */}
                        <div className="h-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
                        
                        {/* Badge #1 */}
                        <div className="absolute top-6 left-6 z-10">
                          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-base font-black flex items-center gap-2 shadow-2xl animate-pulse border-2 border-white">
                            <span className="text-2xl">👑</span>
                            <span>#1</span>
                          </div>
                        </div>

                        {/* Imagen */}
                        {post.imageUrl && (
                          <div className="relative w-full h-56 bg-gradient-to-br from-blue-100 to-purple-100">
                            <Image
                              src={post.imageUrl}
                              alt={post.title}
                              fill
                              sizes="384px"
                              className={`object-cover ${!authUser || shouldFilter || isBlocked ? 'blur-xl' : ''}`}
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          </div>
                        )}

                        {/* Contenido */}
                        <div className="p-6 relative">
                          {/* Patrón decorativo */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-transparent rounded-full blur-2xl"></div>
                          
                          {post.category && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-3 shadow-md">
                              {post.category.icon} {post.category.name}
                            </span>
                          )}
                          
                          <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all relative z-10">
                            {post.title}
                          </h3>
                          
                          <p className="text-sm text-gray-700 mb-4 line-clamp-2 relative z-10">{excerpt}</p>
                          
                          {/* Sección inferior */}
                          <div className="flex items-center justify-between pt-4 border-t-2 border-yellow-300/50 relative z-10">
                            <div className="flex items-center gap-2">
                              <Image
                                src={authorAvatarUrl}
                                alt={post.author.displayName || post.author.email}
                                width={36}
                                height={36}
                                className="rounded-full border-2 border-yellow-400 shadow-md"
                                unoptimized
                              />
                              <span className="text-xs font-bold text-gray-800">
                                {post.author.displayName || post.author.email.split('@')[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full shadow-lg">
                              <Heart className="w-4 h-4 fill-current" />
                              <span className="text-lg font-black">{post._count.likes}</span>
                            </div>
                          </div>
                        </div>

                        {/* Borde decorativo inferior */}
                        <div className="h-2 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400"></div>
                      </div>
                    </div>
                    {/* Efecto de brillo */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                    </Link>
                  </NSFWFilter>
                ) : (
                  <Link href={`/post/${post.slug}`} className="block">
                    <div className="relative max-w-sm mx-auto perspective-1000">
                    <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-400 p-1 rounded-3xl shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 group">
                      <div className="bg-gradient-to-br from-yellow-50 to-white rounded-3xl overflow-hidden">
                        <div className="h-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
                        <div className="absolute top-6 left-6 z-10">
                          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-base font-black flex items-center gap-2 shadow-2xl animate-pulse border-2 border-white">
                            <span className="text-2xl">👑</span>
                            <span>#1</span>
                          </div>
                        </div>
                        {post.imageUrl && (
                          <div className="relative w-full h-56 bg-gradient-to-br from-blue-100 to-purple-100">
                            <Image
                              src={post.imageUrl}
                              alt={post.title}
                              fill
                              sizes="384px"
                              className="object-cover blur-xl"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          </div>
                        )}
                        <div className="p-6 relative">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-transparent rounded-full blur-2xl"></div>
                          {post.category && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-3 shadow-md">
                              {post.category.icon} {post.category.name}
                            </span>
                          )}
                          <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all relative z-10">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-700 mb-4 line-clamp-2 relative z-10">{excerpt}</p>
                          <div className="flex items-center justify-between pt-4 border-t-2 border-yellow-300/50 relative z-10">
                            <div className="flex items-center gap-2">
                              <Image
                                src={authorAvatarUrl}
                                alt={post.author.displayName || post.author.email}
                                width={36}
                                height={36}
                                className="rounded-full border-2 border-yellow-400 shadow-md"
                                unoptimized
                              />
                              <span className="text-xs font-bold text-gray-800">
                                {post.author.displayName || post.author.email.split('@')[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full shadow-lg">
                              <Heart className="w-4 h-4 fill-current" />
                              <span className="text-lg font-black">{post._count.likes}</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-2 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400"></div>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </Link>
                )}
                </div>
              )
            })()}

            {/* Posts #2-6 - Carrusel estilo tarjetas Pokémon */}
            {topPosts.length > 1 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Otros Destacados</h3>
                <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-yellow-100 px-4">
                  {topPosts.slice(1).map((post, index) => {
                  const authorAvatarUrl = getAvatarUrl(post.author.email, post.author.avatarUrl, 28)
                  const excerpt = extractExcerpt(post.content, 80)
                  const shouldFilter = !!(authUser && post.isNSFW && currentUserNSFWProtection)
                  const isBlocked = authUser && blockedUsers.includes(post.author.id)
                  const medalColors = [
                  'from-gray-400 to-gray-600',
                  'from-orange-600 to-orange-800',
                  'from-blue-500 to-blue-700',
                  'from-purple-500 to-purple-700',
                    'from-green-500 to-green-700',
                  ]

                  return (
                      <div key={post.id} className="flex-shrink-0 w-72 snap-start">
                      {authUser ? (
                        <NSFWFilter
                          isNSFW={shouldFilter}
                          authorId={post.author.id}
                          blockedUsers={blockedUsers}
                        >
                          <Link href={`/post/${post.slug}`} className="block h-full">
                        <div className="relative perspective-1000 h-full">
                          <div className={`relative bg-gradient-to-br ${medalColors[index]} p-0.5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group h-[420px] flex flex-col`}>
                            <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full">
                              {/* Borde decorativo superior */}
                              <div className={`h-2 bg-gradient-to-r ${medalColors[index]}`}></div>
                              
                              {/* Badge posición */}
                              <div className="absolute top-4 left-4 z-10">
                                <div className={`bg-gradient-to-r ${medalColors[index]} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white`}>
                                  #{index + 2}
                                </div>
                              </div>

                              {/* Imagen */}
                              <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                                {post.imageUrl ? (
                                  <>
                                    <Image
                                      src={post.imageUrl}
                                      alt={post.title}
                                      fill
                                      sizes="288px"
                                      className={`object-cover ${!authUser || shouldFilter || isBlocked ? 'blur-xl' : ''}`}
                                      unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-4xl">{post.category?.icon || '📝'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Contenido */}
                              <div className="p-4 relative flex-1 flex flex-col">
                                {post.category && (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-2">
                                    {post.category.icon} {post.category.name}
                                  </span>
                                )}
                                
                                <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3rem]">
                                  {post.title}
                                </h3>
                                
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">{excerpt}</p>
                                
                                {/* Sección inferior */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <Image
                                      src={authorAvatarUrl}
                                      alt={post.author.displayName || post.author.email}
                                      width={24}
                                      height={24}
                                      className="rounded-full border border-gray-300"
                                      unoptimized
                                    />
                                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">
                                      {post.author.displayName || post.author.email.split('@')[0]}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-full">
                                    <Heart className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-bold">{post._count.likes}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Borde decorativo inferior */}
                              <div className={`h-1.5 bg-gradient-to-r ${medalColors[index]} flex-shrink-0`}></div>
                            </div>
                          </div>
                          {/* Efecto de brillo */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                          </Link>
                        </NSFWFilter>
                      ) : (
                        <Link href={`/post/${post.slug}`} className="block h-full">
                        <div className="relative perspective-1000 h-full">
                          <div className={`relative bg-gradient-to-br ${medalColors[index]} p-0.5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group h-[420px] flex flex-col`}>
                            <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full">
                              <div className={`h-2 bg-gradient-to-r ${medalColors[index]}`}></div>
                              <div className="absolute top-4 left-4 z-10">
                                <div className={`bg-gradient-to-r ${medalColors[index]} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white`}>
                                  #{index + 2}
                                </div>
                              </div>
                              <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                                {post.imageUrl ? (
                                  <>
                                    <Image
                                      src={post.imageUrl}
                                      alt={post.title}
                                      fill
                                      sizes="288px"
                                      className="object-cover blur-xl"
                                      unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-4xl">{post.category?.icon || '📝'}</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-4 relative flex-1 flex flex-col">
                                {post.category && (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-2">
                                    {post.category.icon} {post.category.name}
                                  </span>
                                )}
                                <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3rem]">
                                  {post.title}
                                </h3>
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">{excerpt}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <Image
                                      src={authorAvatarUrl}
                                      alt={post.author.displayName || post.author.email}
                                      width={24}
                                      height={24}
                                      className="rounded-full border border-gray-300"
                                      unoptimized
                                    />
                                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">
                                      {post.author.displayName || post.author.email.split('@')[0]}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-full">
                                    <Heart className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-bold">{post._count.likes}</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`h-1.5 bg-gradient-to-r ${medalColors[index]} flex-shrink-0`}></div>
                            </div>
                          </div>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                        </Link>
                      )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Wave decoration bottom */}
          <div className="w-full">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249 250 251)"/>
            </svg>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir LibreBlog?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Todo lo que necesitas para crear, compartir y crecer como escritor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-500">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <PenSquare className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Editor Markdown</h3>
              <p className="text-gray-600">
                Escribe con formato profesional usando Markdown. Incluye sintaxis para código, listas, tablas y más.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-purple-500">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Descubrimiento Fácil</h3>
              <p className="text-gray-600">
                Encuentra contenido relevante por categorías, busca por títulos o descubre nuevos escritores.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-pink-500">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comunidad Activa</h3>
              <p className="text-gray-600">
                Conecta con otros escritores, comparte tus posts y construye tu audiencia de forma orgánica.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-green-500">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard Personal</h3>
              <p className="text-gray-600">
                Gestiona todas tus publicaciones desde un panel intuitivo. Edita, elimina o actualiza en segundos.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-yellow-500">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multimedia</h3>
              <p className="text-gray-600">
                Añade imágenes y videos a tus posts. Soportamos URLs de YouTube para embeber contenido.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-red-500">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Privacidad Total</h3>
              <p className="text-gray-600">
                Controla quién ve tu contenido. Publica posts públicos o mantenlos privados como borradores.
              </p>
            </div>
          </div>
        </div>
        
        {/* Wave decoration bottom */}
        <div className="w-full">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#0c2b4d"/>
          </svg>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#0c2b4d] to-[#36234e] text-white">
        {/* Wave decoration top */}
        <div className="w-full">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rotate-180">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#0c2b4d"/>
          </svg>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6">
            ¿Listo para comenzar a escribir?
          </h2>
          <p className="text-lg sm:text-xl text-[#dedff1]/90 mb-8 px-4">
            Únete a cientos de escritores que ya están compartiendo sus historias
          </p>
          <Link href="/register">
            <Button size="lg" variant="primary" className="shadow-2xl px-10">
              Crear mi cuenta gratis
            </Button>
          </Link>
          <p className="text-sm text-[#dedff1]/80 mt-4">
            No se requiere tarjeta de crédito • 100% gratis
          </p>
        </div>
      </section>
    </div>
  )
}