import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css"
import MainNav from "@/components/main-nav"
import Footer from "@/components/footer"
import { Toaster } from "sonner"
import { 
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL
} from "@/lib/settings"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MILO - Moda Exclusiva",
  description: "Descubre las últimas colecciones de moda de MILO.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      publishableKey={NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl={NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      afterSignUpUrl={NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
      signInUrl={NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={NEXT_PUBLIC_CLERK_SIGN_UP_URL}
    >
      <html lang="es">
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            <MainNav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
