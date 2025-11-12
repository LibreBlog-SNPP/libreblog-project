'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { User, Trash2, Save, AlertTriangle, Globe, Facebook, Instagram, Linkedin, Github, ChevronDown, ChevronUp, Users, UserPlus } from 'lucide-react'
import { getGravatarUrl } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import UsernameSection from '@/components/settings/UsernameSection'
import PublicEmailSection from '@/components/settings/PublicEmailSection'
import TwoFactorSection from '@/components/settings/TwoFactorSection'
import ProfileSection from '@/components/settings/ProfileSection'
import NSFWProtectionSection from '@/components/settings/NSFWProtectionSection'

// Interfaz para los datos del usuario
interface UserData {
  id: string
  email: string
  username: string
  publicEmail: string | null
  usernameLastChanged: Date | null
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  websiteUrl: string | null
  githubUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  xUrl: string | null
  tiktokUrl: string | null
  linkedinUrl: string | null
  nsfwProtection: boolean
}

// Interfaz para seguidores y seguidos
interface FollowUser {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [xUrl, setXUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [showSocialLinks, setShowSocialLinks] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [nsfwProtection, setNsfwProtection] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        // Verificar autenticación
        if (authError || !authUser) {
          console.error('Usuario no autenticado:', authError)
          router.push('/login')
          return
        }

        // Obtener datos del usuario desde la API
        const res = await fetch(`/api/users/${authUser.id}`)
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`)
        }
        
        const userData = await res.json()
        if (userData.error) {
          throw new Error(userData.error)
        }
        
        // Establecer datos del usuario en el estado
        setUser(userData)
        setDisplayName(userData.displayName || '')
        setBio(userData.bio || '')
        setAvatarUrl(userData.avatarUrl || '')
        setWebsiteUrl(userData.websiteUrl || '')
        setGithubUrl(userData.githubUrl || '')
        setFacebookUrl(userData.facebookUrl || '')
        setInstagramUrl(userData.instagramUrl || '')
        setXUrl(userData.xUrl || '')
        setTiktokUrl(userData.tiktokUrl || '')
        setLinkedinUrl(userData.linkedinUrl || '')
        setNsfwProtection(userData.nsfwProtection ?? true)
        
        // Verificar estado de 2FA - SOLO factores verificados
        const factors = await supabase.auth.mfa.listFactors()
        const verifiedFactors = factors.data?.totp?.filter(f => f.status === 'verified') || []
        setIs2FAEnabled(verifiedFactors.length > 0)
      } catch (error) {
        console.error('Error cargando usuario:', error)
        setIs2FAEnabled(false)
        setMessage({ 
          type: 'error', 
          text: error instanceof Error ? error.message : 'Error al cargar los datos del usuario' 
        })
      }
    }
    loadUser()
  }, [router])



  // Función para guardar cambios del perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSaving(true)

    try {
      // Validar que el usuario existe
      if (!user?.id) {
        throw new Error('No se encontró información del usuario')
      }

      // Enviar datos actualizados al servidor
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          displayName: displayName.trim() || null, 
          bio: bio.trim() || null, 
          avatarUrl: avatarUrl.trim() || null,
          websiteUrl: websiteUrl.trim() || null,
          githubUrl: githubUrl.trim() || null,
          facebookUrl: facebookUrl.trim() || null,
          instagramUrl: instagramUrl.trim() || null,
          xUrl: xUrl.trim() || null,
          tiktokUrl: tiktokUrl.trim() || null,
          linkedinUrl: linkedinUrl.trim() || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Error HTTP: ${res.status}`)
      }

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
      
      // Recargar página para actualizar navbar y luego redirigir
      setTimeout(() => {
        window.location.href = `/profile/${user.username}`
      }, 1000)
    } catch (error) {
      console.error('Error guardando perfil:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al actualizar el perfil' 
      })
    } finally {
      setIsSaving(false)
    }
  }



  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') {
      setMessage({ type: 'error', text: 'Escribe "ELIMINAR" para confirmar' })
      return
    }

    setIsDeleting(true)

    try {
      const supabase = createClient()
      
      // Eliminar usuario de la base de datos
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Error al eliminar cuenta')

      // Cerrar sesión de Supabase
      await supabase.auth.signOut()
      
      router.push('/')
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar la cuenta' })
      setIsDeleting(false)
    }
  }

  // Función para manejar el toggle de protección NSFW
  const handleNSFWToggle = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/users/nsfw-protection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nsfwProtection: enabled }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al actualizar configuración')
      }

      setNsfwProtection(enabled)
    } catch (error) {
      console.error('Error actualizando protección NSFW:', error)
      throw error
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#dedff1] via-[#dedff1] to-[#5f638f]/20 flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/loading.gif"
            alt="Cargando"
            width={48}
            height={48}
            className="mx-auto mb-4"
            unoptimized
          />
          <p className="text-[#5f638f]">Cargando...</p>
        </div>
      </div>
    )
  }

  const gravatarUrl = getGravatarUrl(user.email)

  // Función para validar URL de forma segura
  const isValidUrl = (url: string): boolean => {
    if (!url || !url.trim()) return false
    try {
      new URL(url)
      return url.startsWith('http')
    } catch {
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dedff1] via-[#dedff1] to-[#5f638f]/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0c2b4d] to-[#5f638f] bg-clip-text text-transparent mb-2">Configuración</h1>
          <p className="text-[#000022]/70">Gestiona tu cuenta y preferencias</p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Quick Actions */}
        <Card variant="elevated" className="mb-6">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#000022]">Editar Perfil Público</h3>
                <p className="text-sm text-[#5f638f] mt-1">
                  Personaliza tu nombre, username, bio y redes sociales
                </p>
              </div>
              <Link href="/edit-profile">
                <Button variant="primary">
                  <User className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* Two Factor Section */}
        <div className="mb-6">
          <TwoFactorSection
            isEnabled={is2FAEnabled}
            onStatusChange={async () => {
              // Recargar el estado real desde Supabase
              const supabase = createClient()
              const factors = await supabase.auth.mfa.listFactors()
              const verifiedFactors = factors.data?.totp?.filter(f => f.status === 'verified') || []
              const newState = verifiedFactors.length > 0
              setIs2FAEnabled(newState)
              setMessage({ 
                type: 'success', 
                text: newState ? '2FA activado correctamente' : '2FA desactivado' 
              })
            }}
          />
        </div>

        {/* NSFW Protection Section */}
        <div className="mb-6">
          <NSFWProtectionSection
            nsfwProtection={nsfwProtection}
            onToggle={handleNSFWToggle}
          />
        </div>

        {/* Account Info */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-[#0c2b4d]" />
              <h2 className="text-xl font-bold text-[#000022]">Información de Cuenta</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/60 rounded-lg border border-[#5f638f]/20">
                <Image
                  src={isValidUrl(avatarUrl) ? avatarUrl : gravatarUrl}
                  alt="Avatar"
                  width={64}
                  height={64}
                  className="rounded-full border-2 border-[#5f638f]/30"
                  unoptimized
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#5f638f]">Username</p>
                  <p className="text-lg font-semibold text-[#000022]">@{user.username}</p>
                </div>
              </div>

              <div className="p-4 bg-[#dedff1]/50 border border-[#5f638f]/30 rounded-lg">
                <p className="text-sm font-medium text-[#0c2b4d] mb-1">Email de la cuenta</p>
                <p className="text-base text-[#000022] font-mono">{user.email}</p>
                <p className="text-xs text-[#5f638f] mt-2">
                  Este es tu email de inicio de sesión. No se muestra públicamente.
                </p>
              </div>

              <div className="text-center pt-2">
                <Link href="/edit-profile">
                  <Button variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    Editar Perfil Público
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>



        {/* Followers Section */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-[#0c2b4d]" />
              <h2 className="text-xl font-bold text-[#000022]">Seguidores</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    setShowFollowers(!showFollowers)
                    // Solo cargar datos si se está mostrando por primera vez
                    if (!showFollowers && followers.length === 0) {
                      setLoadingFollowers(true)
                      try {
                        const res = await fetch(`/api/users/${user.id}/followers`)
                        if (!res.ok) {
                          console.error(`Error HTTP ${res.status} al cargar seguidores`)
                          setFollowers([])
                          return
                        }
                        const data = await res.json()
                        if (data.error) {
                          console.error('Error en respuesta:', data.error)
                          setFollowers([])
                          return
                        }
                        setFollowers(data.followers || [])
                      } catch (error) {
                        console.error('Error cargando seguidores:', error)
                        setFollowers([])
                      } finally {
                        setLoadingFollowers(false)
                      }
                    }
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Mis Seguidores
                </Button>
                
                <Button
                  variant="outline"
                  onClick={async () => {
                    setShowFollowing(!showFollowing)
                    // Solo cargar datos si se está mostrando por primera vez
                    if (!showFollowing && following.length === 0) {
                      setLoadingFollowing(true)
                      try {
                        const res = await fetch(`/api/users/${user.id}/following`)
                        if (!res.ok) {
                          console.error(`Error HTTP ${res.status} al cargar seguidos`)
                          setFollowing([])
                          return
                        }
                        const data = await res.json()
                        if (data.error) {
                          console.error('Error en respuesta:', data.error)
                          setFollowing([])
                          return
                        }
                        setFollowing(data.following || [])
                      } catch (error) {
                        console.error('Error cargando seguidos:', error)
                        setFollowing([])
                      } finally {
                        setLoadingFollowing(false)
                      }
                    }
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Siguiendo
                </Button>
              </div>

              {showFollowers && (
                <div className="border-2 border-[#5f638f]/20 rounded-lg p-4">
                  <h3 className="font-semibold text-[#000022] mb-3">Mis Seguidores</h3>
                  {loadingFollowers ? (
                    <div className="text-center py-4">
                      <Image
                        src="/loading.gif"
                        alt="Cargando"
                        width={24}
                        height={24}
                        className="mx-auto"
                        unoptimized
                      />
                    </div>
                  ) : followers.length === 0 ? (
                    <p className="text-[#5f638f] text-center py-4">No tienes seguidores aún</p>
                  ) : (
                    <div className="space-y-3">
                      {followers.map((follower) => (
                        <div key={follower.id} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-[#5f638f]/20">
                          <Image
                            src={follower.avatarUrl || getGravatarUrl(follower.email)}
                            alt={follower.displayName || follower.email}
                            width={40}
                            height={40}
                            className="rounded-full flex-shrink-0 w-10 h-10"
                            unoptimized
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#000022] truncate text-sm sm:text-base">
                              {follower.displayName || follower.email.split('@')[0]}
                            </p>
                            <p className="text-xs sm:text-sm text-[#5f638f] truncate">{follower.email}</p>
                          </div>
                          <Link href={`/profile/${follower.email.split('@')[0]}`} className="flex-shrink-0">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
                              Ver perfil
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showFollowing && (
                <div className="border-2 border-[#5f638f]/20 rounded-lg p-4">
                  <h3 className="font-semibold text-[#000022] mb-3">Siguiendo</h3>
                  {loadingFollowing ? (
                    <div className="text-center py-4">
                      <Image
                        src="/loading.gif"
                        alt="Cargando"
                        width={24}
                        height={24}
                        className="mx-auto"
                        unoptimized
                      />
                    </div>
                  ) : following.length === 0 ? (
                    <p className="text-[#5f638f] text-center py-4">No sigues a nadie aún</p>
                  ) : (
                    <div className="space-y-3">
                      {following.map((followedUser) => (
                        <div key={followedUser.id} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-[#5f638f]/20">
                          <Image
                            src={followedUser.avatarUrl || getGravatarUrl(followedUser.email)}
                            alt={followedUser.displayName || followedUser.email}
                            width={40}
                            height={40}
                            className="rounded-full flex-shrink-0 w-10 h-10"
                            unoptimized
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#000022] truncate text-sm sm:text-base">
                              {followedUser.displayName || followedUser.email.split('@')[0]}
                            </p>
                            <p className="text-xs sm:text-sm text-[#5f638f] truncate">{followedUser.email}</p>
                          </div>
                          <Link href={`/profile/${followedUser.email.split('@')[0]}`} className="flex-shrink-0">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
                              Ver perfil
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="text-center pt-4">
                <Link href={`/profile/${user?.username}`}>
                  <Button variant="outline">
                    Ver mi perfil público
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Danger Zone */}
        <Card variant="elevated" className="border-2 border-red-200">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">Zona de Peligro</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#000022] mb-1">
                  Eliminar Cuenta
                </h3>
                <p className="text-sm text-[#5f638f] mb-4">
                  Esta acción es permanente y no se puede deshacer. Se eliminarán:
                </p>
                <ul className="text-sm text-[#5f638f] list-disc list-inside mb-4 space-y-1">
                  <li>Tu cuenta de usuario</li>
                  <li>Todos tus posts (públicos y borradores)</li>
                  <li>Tu información de perfil</li>
                </ul>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar mi Cuenta
                </Button>
              ) : (
                <div className="space-y-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <p className="text-sm font-medium text-red-900">
                    ⚠️ ¿Estás absolutamente seguro?
                  </p>
                  <p className="text-sm text-red-800">
                    Escribe <strong>ELIMINAR</strong> para confirmar:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Escribe ELIMINAR"
                    className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      onClick={handleDeleteAccount}
                      isLoading={isDeleting}
                      disabled={deleteConfirmText !== 'ELIMINAR'}
                    >
                      Confirmar Eliminación
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}