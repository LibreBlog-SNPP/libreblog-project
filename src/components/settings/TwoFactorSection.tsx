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
      
      {/* Info Box */}
      {!isEnabled && !qrCode && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            ¿Qué es 2FA?
          </h3>
          <p className="text-sm text-blue-800 mb-2">
            La autenticación de dos factores añade una capa extra de seguridad a tu cuenta. Además de tu contraseña, necesitarás un código de 6 dígitos que cambia cada 30 segundos.
          </p>
          <p className="text-sm text-blue-800 font-medium mb-1">Cómo funciona:</p>
          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1 ml-2">
            <li>Activas 2FA y escaneas un código QR con tu teléfono</li>
            <li>Tu app genera códigos de 6 dígitos cada 30 segundos</li>
            <li>Al iniciar sesión, ingresas email + contraseña + código</li>
            <li>Solo tú con tu teléfono puedes acceder a tu cuenta</li>
          </ol>
          <p className="text-xs text-blue-700 mt-3">
            💡 Apps recomendadas: Google Authenticator, Authy, Microsoft Authenticator
          </p>
        </div>
      )}

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
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Importante:</p>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>Guarda este código en un lugar seguro</li>
              <li>Si pierdes tu teléfono, no podrás acceder a tu cuenta</li>
              <li>Toma una captura de pantalla del QR como respaldo</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-700 mb-4 font-medium">
            <strong>Paso 1:</strong> Descarga una app de autenticación
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">Google Authenticator</span>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">Authy</span>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">Microsoft Authenticator</span>
          </div>
          
          <p className="text-sm text-gray-700 mb-4 font-medium">
            <strong>Paso 2:</strong> Escanea este código QR con la app
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
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 mb-1">✓ 2FA está activo</p>
                <p className="text-xs text-green-700 mb-2">Tu cuenta está protegida con autenticación de dos factores</p>
                <div className="text-xs text-green-700 space-y-1">
                  <p>• Cada vez que inicies sesión, necesitarás tu contraseña + código de 6 dígitos</p>
                  <p>• El código se genera en tu app de autenticación</p>
                  <p>• Nadie puede acceder a tu cuenta sin tu teléfono</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Nota:</strong> Para desactivar 2FA, primero debes cerrar sesión e iniciar de nuevo ingresando tu código 2FA. Esto es una medida de seguridad.
            </p>
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
