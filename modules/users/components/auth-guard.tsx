import { useAuth, useUser } from '@clerk/nextjs'

export function useAuthUser() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { user } = useUser()

  return {
    isLoaded,
    isSignedIn,
    userId,
    user,
    isAuthenticated: isSignedIn && isLoaded,
  }
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso requerido
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para acceder a esta página
          </p>
          <a
            href="/sign-in"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
