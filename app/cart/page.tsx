"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  image: string
  slug: string
  quantity: number
  addedAt: string
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load cart items from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const cart = localStorage.getItem('cart')
        if (cart) {
          setCartItems(JSON.parse(cart))
        }
      } catch (error) {
        console.error('Error loading cart:', error)
      }
      setIsLoading(false)
    }

    loadCart()
  }, [])

  // Update quantity of an item
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }

    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  // Remove item from cart
  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id)
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  // Clear entire cart
  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart')
    window.dispatchEvent(new Event('cartUpdated'))
  }

  // Calculate total price
  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  if (isLoading) {
    return (
      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 text-center">
          <p>Cargando carrito...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Tu Carrito de Compras</h1>
        
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-20 w-20 text-gray-400" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Tu carrito está vacío.</p>
            <Link href="/">
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none px-8 py-3">
                Continuar Comprando
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Cart Items */}
            <div className="space-y-4 mb-8">
              {cartItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4">
                  {/* Product Image */}
                  <div className="w-full sm:w-24 h-32 sm:h-24 relative bg-gray-100 rounded">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      style={{ objectFit: "contain" }}
                      className="rounded"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 flex flex-col sm:flex-row justify-between">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-gray-600">Gs {item.price.toFixed(2)}</p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 rounded">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 text-center min-w-[2rem]">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-semibold">Gs {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Cart Summary */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Vaciar Carrito
                  </Button>
                  <Link href="/">
                    <Button variant="outline">
                      Continuar Comprando
                    </Button>
                  </Link>
                </div>
                
                <div className="text-right">
                  <p className="text-lg">Total: <span className="font-bold text-2xl">Gs {totalPrice.toFixed(2)}</span></p>
                  <p className="text-sm text-gray-600">{cartItems.length} artículo{cartItems.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="text-center">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-none px-12 py-3 text-lg">
                  Proceder al Pago
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
