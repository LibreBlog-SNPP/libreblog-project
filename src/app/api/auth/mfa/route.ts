import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const factors = await supabase.auth.mfa.listFactors()
    if (factors.error) {
      return NextResponse.json({ error: factors.error.message }, { status: 400 })
    }

    const verifiedFactors = factors.data?.totp?.filter(f => f.status === 'verified') || []
    const unverifiedFactors = factors.data?.totp?.filter(f => f.status !== 'verified') || []

    return NextResponse.json({
      isEnabled: verifiedFactors.length > 0,
      hasUnverified: unverifiedFactors.length > 0,
      totalFactors: factors.data?.totp?.length || 0
    })
  } catch (error) {
    console.error('Error checking MFA status:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const factors = await supabase.auth.mfa.listFactors()
    if (factors.error) {
      return NextResponse.json({ error: factors.error.message }, { status: 400 })
    }

    // Eliminar todos los factores TOTP
    if (factors.data?.totp && factors.data.totp.length > 0) {
      for (const factor of factors.data.totp) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
        if (error) {
          console.warn('Error eliminando factor:', error)
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Todos los factores 2FA eliminados' })
  } catch (error) {
    console.error('Error resetting MFA:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}