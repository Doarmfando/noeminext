'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth/actions'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import CirclesBackground from '@/components/auth/CirclesBackground'
import LeftPanel from '@/components/auth/LeftPanel'
import RestaurantLogo from '@/components/auth/RestaurantLogo'
import FooterBanner from '@/components/auth/FooterBanner'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!username.trim() || !password) {
        setError('Por favor ingresa usuario/email y contraseña')
        setLoading(false)
        return
      }

      const result = await login(username.trim(), password)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        // Login exitoso, redirigir al dashboard
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="font-['Segoe_UI'] relative min-h-screen w-full">
        <CirclesBackground />

        <div className="flex h-screen w-screen relative z-10 login-wrapper">
          <LeftPanel panelImage="/images/left-panel-bg.png" altText="Panel lateral del login">
            <RestaurantLogo />
          </LeftPanel>

          <div className="flex-1 flex items-center justify-center bg-transparent relative z-20 login-main-content px-4 md:px-0">
            <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex flex-col gap-6 md:gap-8 z-30 login-card">
              <div className="flex flex-col items-center">
                <h1 className="text-3xl md:text-4xl font-extrabold text-center bg-gradient-to-r from-[#2f50ac] via-[#fff212] to-[#2f50ac] bg-[length:200%_100%] bg-clip-text text-transparent animate-rayFlash">
                  Inicia Sesión
                </h1>
              </div>

              {/* Mostrar error si existe */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Usuario */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="Usuario o correo electrónico"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Contraseña */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="Contraseña"
                    disabled={loading}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="bg-[#1E3A8A] text-white p-3 text-base font-semibold rounded-lg cursor-pointer transition-all duration-300 outline-none hover:bg-[#2A4FB0] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Iniciando sesión...
                    </span>
                  ) : (
                    'Acceder'
                  )}
                </button>

                {/* Link de recuperación de contraseña */}
                <div className="text-center">
                  <a
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </form>

              {/* Información de credenciales de prueba */}
              <div className="text-xs text-gray-500 text-center p-3 bg-gray-50 rounded-lg">
                <strong>Usuarios disponibles:</strong>
                <br />
                <span className="text-green-600">fabio</span> o{' '}
                <span className="text-green-600">fabio@restaurantenoemi.com</span>
                <br />
                <span className="text-green-600">brando</span> o{' '}
                <span className="text-green-600">brandoarmas@hotmail.com</span>
              </div>
            </div>
          </div>

          <FooterBanner
            logo="/images/logo3.png"
            logoAlt="Fortex Logo"
            companyName="Fortex"
            contactLabel="Contacto:"
            phoneNumbers={['984 229 446', '944 532 822']}
            version="1.0.0"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes rayFlash {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        :global(.animate-rayFlash) {
          animation: rayFlash 3s linear infinite alternate;
        }

        :global(.password-input::-ms-reveal),
        :global(.password-input::-webkit-textfield-decoration-container),
        :global(.password-input::-webkit-credentials-auto-fill-button),
        :global(.password-input::-webkit-strong-password-auto-fill-button) {
          display: none !important;
        }

        @media (max-width: 768px) {
          :global(.left-panel) {
            display: none !important;
          }
          :global(.login-bottom-banner) {
            display: none !important;
          }
          :global(.login-main-content) {
            height: 100vh;
            width: 100% !important;
            padding: 20px;
          }
          :global(.login-card) {
            margin: auto;
            max-width: 350px;
            padding: 24px;
          }
          :global(.min-h-screen) {
            min-height: 100vh;
            min-height: 100svh;
          }
        }

        @media (max-width: 480px) {
          :global(.login-card) {
            max-width: 320px;
            padding: 20px;
            gap: 20px;
          }
          :global(.login-main-content) {
            padding: 16px;
          }
        }
      `}</style>
    </>
  )
}
