'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { isEmailAuthEnabled } from '@/lib/utils'
import { LogIn, Mail, Lock, AlertCircle, CheckCircle, Shield } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const message = searchParams.get('message')
    const redirect = searchParams.get('redirect')
    
    if (message === 'confirmed') {
      setSuccess('¡Email confirmado! Ya puedes iniciar sesión.')
    } else if (message === 'password-updated') {
      setSuccess('Contraseña actualizada exitosamente.')
    } else if (redirect) {
      setError('Debes iniciar sesión para acceder a este contenido.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Cerrar sesión actual si existe (cambio de cuenta)
      const { data: currentUser } = await supabase.auth.getUser()
      if (currentUser.user) {
        await supabase.auth.signOut()
      }
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos')
        } else {
          setError(authError.message)
        }
        return
      }

      // Verificar si el usuario tiene 2FA activo
      const factors = await supabase.auth.mfa.listFactors()
      const verifiedFactors = factors.data?.totp?.filter(f => f.status === 'verified') || []
      
      if (verifiedFactors.length > 0) {
        // Usuario tiene 2FA activo, solicitar código
        setFactorId(verifiedFactors[0].id)
        setNeeds2FA(true)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // No tiene 2FA, login completo
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intenta nuevamente.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: totpCode
      })

      if (error) {
        if (error.message.includes('Invalid TOTP code')) {
          setError('Código incorrecto. Verifica tu app de autenticación.')
        } else {
          setError(error.message)
        }
        return
      }

      // 2FA verificado, redirigir
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Error al verificar código. Intenta nuevamente.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dedff1] via-[#dedff1] to-[#5f638f]/20 px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0c2b4d] to-[#36234e] rounded-3xl shadow-2xl mb-6 animate-pulse">
            <LogIn className="w-10 h-10 text-[#dedff1]" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-[#0c2b4d] to-[#36234e] bg-clip-text text-transparent">Iniciar Sesión</h1>
          <p className="text-[#5f638f] mt-3 text-lg">Bienvenido de vuelta a LibreBlog</p>
        </div>

        {/* Card de Login */}
        <Card variant="default">
          <CardContent className="p-6">
            {isEmailAuthEnabled() ? (
            needs2FA ? (
              <form onSubmit={handleVerify2FA} className="space-y-5">
                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Autenticación de Dos Factores</p>
                      <p className="text-xs mb-2">Tu cuenta está protegida con 2FA</p>
                      <ol className="text-xs space-y-1 list-decimal list-inside">
                        <li>Abre tu app de autenticación (Google Authenticator, Authy, etc.)</li>
                        <li>Busca la entrada de "LibreBlog"</li>
                        <li>Ingresa el código de 6 dígitos que aparece</li>
                      </ol>
                      <p className="text-xs mt-2 text-blue-700">
                        🕒 El código cambia cada 30 segundos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* TOTP Code Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Verificación
                  </label>
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full px-4 py-3 border-2 border-[#5f638f]/30 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2b4d] focus:border-transparent transition-all shadow-sm text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  disabled={totpCode.length !== 6}
                  className="w-full"
                >
                  {isLoading ? 'Verificando...' : 'Verificar Código'}
                </Button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setNeeds2FA(false)
                    setTotpCode('')
                    setFactorId('')
                    setError('')
                  }}
                  className="w-full text-sm text-[#5f638f] hover:text-[#0c2b4d] transition-colors"
                >
                  ← Volver al login
                </button>
              </form>
            ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Success Alert */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#5f638f]/30 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2b4d] focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#5f638f]/30 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2b4d] focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
            )
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                  El inicio de sesión por email/contraseña está deshabilitado. Usa OAuth (GitHub) desde la navegación.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-[#000022]">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-[#0c2b4d] font-bold hover:text-[#36234e] transition-colors underline">
              Regístrate aquí
            </Link>
          </p>
          <p className="text-[#000022]">
            ¿Olvidaste tu contraseña?{' '}
            <Link href="/forgot-password" className="text-[#0c2b4d] font-bold hover:text-[#36234e] transition-colors underline">
              Recupérala aquí
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-[#5f638f] hover:text-[#0c2b4d] transition-colors font-medium">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}