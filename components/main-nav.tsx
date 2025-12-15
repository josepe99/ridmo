"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingBag, X, User, Settings } from "lucide-react"
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCountry, Country } from "@/context/country-context"

export default function MainNav() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const { user } = useUser()
  const { country, setCountry } = useCountry()

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  // Function to get cart count from localStorage
  const getCartCount = () => {
    try {
      const cart = localStorage.getItem('cart')
      if (cart) {
        const cartItems = JSON.parse(cart)
        // Ensure cartItems is an array
        if (Array.isArray(cartItems)) {
          return cartItems.reduce((total: number, item: any) => total + (item.quantity || 1), 0)
        }
      }
    } catch (error) {
      console.error('Error reading cart from localStorage:', error)
    }
    return 0
  }

  // Update cart count on component mount and when localStorage changes
  useEffect(() => {
    setCartItemCount(getCartCount())

    // Listen for storage changes (when cart is updated from other components)
    const handleStorageChange = () => {
      setCartItemCount(getCartCount())
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom cart update events
    window.addEventListener('cartUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', handleStorageChange)
    }
  }, [])

  // Check if user has admin role
  const isAdmin = user?.publicMetadata?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white border-b border-gray-800">
      {/* Main Header */}
      <div className="relative flex items-center h-20 px-4 md:px-6">
        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none select-none">
          <Link href="/" className="flex items-center gap-3 pointer-events-auto select-auto">
            <Image src="/images/ridmo-logo.png" alt="Milo Logo" width={48} height={48} className="h-12 w-12" />
            <span className="text-3xl font-extrabold tracking-tight hidden md:block">RIDMO</span>
          </Link>
        </div>
        {/* Right Icons */}
        <div className="ml-auto flex items-center gap-4 lg:w-1/3 justify-end">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className="border border-gray-600 rounded px-2 py-1 text-sm bg-black text-white"
          >
            <option value="AR">AR</option>
            <option value="PY">PY</option>
          </select>
          {/* Botón de búsqueda eliminado, solo logo y RIDMO quedan en el centro */}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="sr-only">Carrito de compras</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs text-black">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Admin Link - Only show for admin users */}
          {isAdmin && (
            <Link href="/admin/collections">
              <Button variant="ghost" size="icon" className="rounded-full" title="Admin Panel">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Admin</span>
              </Button>
            </Link>
          )}

          {/* User Authentication */}
          <SignedOut>
            <Link href="/sign-in">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Iniciar sesión</span>
              </Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                }
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </div>

      {/* Full-screen Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center p-4 animate-in fade-in-0 duration-300">
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full" onClick={toggleSearch}>
            <X className="h-6 w-6" />
            <span className="sr-only">Cerrar búsqueda</span>
          </Button>
          <div className="w-full max-w-3xl px-4">
            <h2 className="text-3xl font-bold text-center mb-8">¿Qué estás buscando?</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar prendas, colecciones..."
                className="w-full pl-10 pr-4 py-3 text-lg border-b-2 border-gray-300 focus:border-black focus:ring-0 rounded-none"
              />
            </div>
            {/* Add search suggestions or recent searches here if desired */}
            <p className="text-center text-gray-500 text-sm mt-4">Presiona Enter para buscar</p>
          </div>
        </div>
      )}
    </header>
  )
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}
