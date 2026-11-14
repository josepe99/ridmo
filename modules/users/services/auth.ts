import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return userId
}

export async function getAuthUser() {
  const { userId } = await auth()
  return { userId, isAuthenticated: !!userId }
}

export async function requireAdmin() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Check if user has admin role using private metadata
  const user = await currentUser()
  const privateMetadata = user?.privateMetadata as { role?: string } | undefined
  const isAdmin = privateMetadata?.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect('/')
  }
  
  return userId
}
