# Configuración de Clerk Authentication

Este documento explica cómo configurar Clerk para la autenticación en el proyecto MILO.

## 1. Configuración inicial de Clerk

### Crear cuenta en Clerk
1. Ve a [clerk.com](https://clerk.com) y crea una cuenta
2. Crea una nueva aplicación
3. Selecciona las opciones de autenticación que prefieras (email, Google, GitHub, etc.)

### Variables de entorno
Copia las siguientes variables desde tu dashboard de Clerk a tu archivo `.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## 2. Configuración centralizada

Las variables de entorno están exportadas directamente desde `lib/settings.ts`:

```typescript
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
export const NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;
// etc...
```

Para usar las variables en tu código:

```typescript
import { CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY } from '@/lib/settings';
```

## 2. Características implementadas

### Autenticación
- ✅ Iniciar sesión (`/sign-in`)
- ✅ Registrarse (`/sign-up`) 
- ✅ Perfil de usuario (`/profile`)
- ✅ Cerrar sesión
- ✅ Middleware de protección de rutas
- ✅ Componentes de autenticación en la navegación

### Protección de rutas
Las siguientes rutas están protegidas por defecto:
- `/dashboard/*`
- `/admin/*`
- `/profile/*`
- `/account/*`

### Componentes
- `UserButton`: Botón de usuario con avatar y menú desplegable
- `RequireAuth`: Componente para proteger páginas del lado del cliente
- `useAuthUser`: Hook personalizado para obtener información del usuario

### Helpers server-side
- `requireAuth()`: Requiere autenticación en Server Components
- `getAuthUser()`: Obtiene información del usuario en Server Components
- `requireAdmin()`: Requiere permisos de administrador

## 3. Configuración de administradores

Para configurar usuarios administradores:

1. Ve al dashboard de Clerk
2. Selecciona tu aplicación
3. Ve a "Users" → selecciona un usuario
4. En "Metadata" → "Public metadata", agrega:
```json
{
  "role": "admin"
}
```

## 4. Personalización

### Temas y estilos
Los componentes de Clerk están personalizados para mantener la consistencia visual con el diseño de MILO:

```tsx
<SignIn 
  appearance={{
    elements: {
      formButtonPrimary: 'bg-black hover:bg-gray-800 text-sm normal-case',
      card: 'shadow-lg',
      headerTitle: 'text-gray-900',
    }
  }}
/>
```

### URLs de redirección
Puedes personalizar las URLs de redirección editando las variables de entorno:
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`: Donde redirigir después del login
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`: Donde redirigir después del registro

## 5. Uso en el código

### Client Components
```tsx
import { useAuth, useUser } from '@clerk/nextjs'

function MyComponent() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()

  if (!isSignedIn) return <div>Please sign in</div>
  
  return <div>Hello {user?.firstName}!</div>
}
```

### Server Components
```tsx
import { auth } from '@clerk/nextjs/server'

async function MyServerComponent() {
  const { userId } = await auth()
  
  if (!userId) {
    // Redirect or show auth required message
  }
  
  return <div>Protected content</div>
}
```

### API Routes
```tsx
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Your API logic here
}
```

## 6. Estructura de archivos

```
app/
├── sign-in/[[...sign-in]]/page.tsx    # Página de inicio de sesión
├── sign-up/[[...sign-up]]/page.tsx    # Página de registro
├── profile/page.tsx                    # Página de perfil
└── layout.tsx                          # ClerkProvider configurado

components/
└── auth/
    └── auth-guard.tsx                  # Componente de protección

lib/
├── auth.ts                             # Helpers server-side
└── settings.ts                         # Configuración centralizada

middleware.ts                           # Middleware de Clerk
```

## 7. Próximos pasos

1. **Webhooks**: Configura webhooks para sincronizar datos de usuario con tu base de datos
2. **Roles avanzados**: Implementa un sistema de roles más complejo
3. **Organizaciones**: Si necesitas soporte multi-tenant
4. **SSO**: Configura Single Sign-On para empresas

## Soporte

Para más información, consulta la [documentación oficial de Clerk](https://clerk.com/docs).
