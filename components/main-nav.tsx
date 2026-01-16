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
  const [activeModal, setActiveModal] = useState<"menu" | "contact" | null>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  const { user } = useUser()
  const { country, setCountry } = useCountry()

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  const openMenu = () => setActiveModal("menu")
  const openContact = () => setActiveModal("contact")
  const closeModal = () => setActiveModal(null)

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

  useEffect(() => {
    if (!activeModal) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeModal])

  // Check if user has admin role
  const isAdmin = user?.publicMetadata?.role === 'admin'
  const menuPrimaryItems = [
    "La Familia Collection",
    "Handbags",
    "Women",
    "Men",
    "New In",
    "Children",
    "Travel",
    "Jewelry & Watches",
    "Decor & Lifestyle",
    "Fragrances & Make-Up",
    "Gifts",
  ]
  const menuSecondaryItems = ["Gucci Services", "World of Gucci", "Store Locator"]
  const contactItems = ["WhatsApp", "Email", "Instagram"]

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main Header */}
      <div className="relative flex items-center h-15 px-4 md:px-6">
        <div className="flex items-center gap-3 lg:w-1/3">
          <Button
            variant="ghost"
            className="gap-2 text-xs font-semibold uppercase tracking-[0.2em]"
            onClick={openContact}
          >
            <span className="text-sm leading-none">+</span>
            Contactanos
          </Button>
        </div>
        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none select-none">
          <Link href="/" className="flex items-center gap-3 pointer-events-auto select-auto">
            <span className="text-4xl font-extrabold tracking-tight hidden md:block">RIDMO</span>
          </Link>
        </div>
        {/* Right Icons */}
        <div className="ml-auto flex items-center gap-4 lg:w-1/3 justify-end">
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

          <Button
            variant="ghost"
            className="gap-2 text-xs font-semibold uppercase tracking-[0.2em]"
            onClick={openMenu}
          >
            <MenuIcon className="h-4 w-4" />
            Menu
          </Button>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nav-modal-title"
            className="absolute inset-y-0 right-0 w-full max-w-[420px] bg-white px-8 py-10 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="nav-modal-title" className="sr-only">
              {activeModal === "menu" ? "Menu" : "Contactanos"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-6 top-6 rounded-full bg-black text-white hover:bg-black/90"
              onClick={closeModal}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar modal</span>
            </Button>

            {activeModal === "menu" ? (
              <nav className="mt-10 space-y-6">
                <ul className="space-y-4 text-lg font-medium text-black">
                  {menuPrimaryItems.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className="transition-opacity hover:opacity-60"
                        onClick={closeModal}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-3 text-sm font-medium text-black/70">
                  {menuSecondaryItems.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className="transition-opacity hover:opacity-60"
                        onClick={closeModal}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : (
              <div className="mt-10 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                    Contactanos
                  </p>
                  <p className="mt-3 text-sm text-black/70">
                    Escribenos y te ayudamos con lo que necesites.
                  </p>
                </div>
                <ul className="space-y-4 text-lg font-medium text-black">
                  {contactItems.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className="transition-opacity hover:opacity-60"
                        onClick={closeModal}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

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
