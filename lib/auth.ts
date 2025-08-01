import { auth } from '@clerk/nextjs/server'
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
  const { userId, sessionClaims } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Check if user has admin role (you'll need to set this up in Clerk)
  const metadata = sessionClaims?.metadata as { role?: string } | undefined
  const isAdmin = metadata?.role === 'admin'
  
  if (!isAdmin) {
    redirect('/')
  }
  
  return userId
}
