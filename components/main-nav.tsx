"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingBag, X, User } from "lucide-react"
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"

export default function MainNav() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white text-black border-b border-gray-200">
      {/* Main Header */}
      <div className="flex items-center justify-between h-20 px-4 md:px-6">
        {/* Left side (Mobile Menu Trigger) */}
        <div className="flex items-center lg:w-1/3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <Link href="/" className="mr-6 flex items-center gap-2 py-4">
                <Image src="/images/milo-logo.png" alt="Milo Logo" width={32} height={32} className="h-8 w-8" />
                <span className="text-lg font-semibold tracking-tight">MILO</span>
              </Link>
              <nav className="grid gap-4 py-6 text-lg font-medium">
                <Link href="/" className="flex w-full items-center py-2">
                  Inicio
                </Link>
                <Link href="/coleccion" className="flex w-full items-center py-2">
                  Colecciones
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Center Logo */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/milo-logo.png" alt="Milo Logo" width={40} height={40} className="h-10 w-10" />
            <span className="text-2xl font-bold tracking-tight">MILO</span>
          </Link>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4 lg:w-1/3 justify-end">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleSearch}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Buscar</span>
          </Button>
          
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
          
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="sr-only">Carrito de compras</span>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-xs text-white">
                0
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Secondary Navigation (Desktop Only) - Removed all links */}
      <nav className="hidden lg:flex justify-center py-4 border-t border-gray-200">
        <ul className="flex gap-8">{/* No links here as requested */}</ul>
      </nav>

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
