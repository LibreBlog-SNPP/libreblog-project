'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TwoFactorSectionProps {
  isEnabled: boolean;
  onStatusChange: (wasEnabled: boolean) => void;
}

export default function TwoFactorSection({ isEnabled, onStatusChange }: TwoFactorSectionProps) {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const supabase = createClient();

  const cleanupUnverifiedFactors = async () => {
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) throw factors.error;

    if (factors.data?.totp && factors.data.totp.length > 0) {
      for (const factor of factors.data.totp) {
        if (factor.status !== 'verified') {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    setError('');

    try {
      await cleanupUnverifiedFactors();

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: any) {
      setError(err.message || 'Error al habilitar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!factorId) throw new Error('No hay factor para verificar');

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verifyCode
      });

      if (error) {
        if (error.message.includes('Invalid TOTP code')) {
          throw new Error('Código incorrecto. Verifica que esté actualizado.');
        }
        throw error;
      }

      setQrCode('');
      setSecret('');
      setFactorId('');
      setVerifyCode('');
      onStatusChange(false);
    } catch (err: any) {
      setError(err.message || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      if (factorId) {
        await supabase.auth.mfa.unenroll({ factorId });
      }
    } catch (err) {
      console.warn('Error limpiando factor:', err);
    } finally {
      setQrCode('');
      setSecret('');
      setFactorId('');
      setVerifyCode('');
      setError('');
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('¿Desactivar autenticación de dos factores?')) return;

    setLoading(true);
    setError('');

    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      let hasError = false;
      if (factors.data?.totp && factors.data.totp.length > 0) {
        for (const factor of factors.data.totp) {
          const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (error) {
            console.error('Error eliminando factor:', error);
            hasError = true;
          }
        }
      }

      if (hasError) {
        throw new Error('Para desactivar 2FA, debes cerrar sesión e iniciar de nuevo con tu código 2FA. Esto es una medida de seguridad de Supabase.');
      }

      onStatusChange(true);
    } catch (err: any) {
      setError(err.message || 'Error al desactivar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleReset2FA = async () => {
    if (!confirm('¿Resetear completamente el 2FA? Esto eliminará todos los factores existentes.')) return;

    setLoading(true);
    setError('');

    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      if (factors.data?.totp && factors.data.totp.length > 0) {
        for (const factor of factors.data.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(e => {
            console.warn('Error eliminando factor (ignorado):', e);
          });
        }
      }

      setQrCode('');
      setSecret('');
      setFactorId('');
      setVerifyCode('');
      setShowReset(false);
      onStatusChange(true);
    } catch (err: any) {
      setError(err.message || 'Error al resetear 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Autenticación de Dos Factores (2FA)</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {error}
              {error.includes('already exists') && (
                <div className="mt-2 text-xs">
                  <button
                    onClick={() => setShowReset(true)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    ¿Resetear 2FA?
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isEnabled && !qrCode && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Agrega una capa extra de seguridad a tu cuenta usando Google Authenticator, Authy u otra app TOTP.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {loading ? 'Cargando...' : 'Habilitar 2FA'}
            </button>
            <button
              onClick={() => setShowReset(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Resetear 2FA
            </button>
          </div>
        </div>
      )}

      {qrCode && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Paso 1:</strong> Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, Microsoft Authenticator, etc.)
          </p>
          
          <div className="mb-4 flex justify-center">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">O ingresa este código manualmente:</p>
            <code className="text-sm font-mono">{secret}</code>
          </div>

          <form onSubmit={handleVerify}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <strong>Paso 2:</strong> Código de verificación (6 dígitos)
            </label>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="123456"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {loading ? 'Verificando...' : 'Verificar y Activar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isEnabled && (
        <div>
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">✓ 2FA está activo</p>
          </div>
          <button
            onClick={handleDisable}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
          >
            {loading ? 'Desactivando...' : 'Desactivar 2FA'}
          </button>
        </div>
      )}

      {showReset && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Resetear 2FA</h3>
          <p className="text-sm text-yellow-700 mb-3">
            Esto eliminará todos los factores 2FA existentes y te permitirá configurar uno nuevo.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset2FA}
              disabled={loading}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:bg-gray-300"
            >
              {loading ? 'Reseteando...' : 'Confirmar Reset'}
            </button>
            <button
              onClick={() => setShowReset(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
