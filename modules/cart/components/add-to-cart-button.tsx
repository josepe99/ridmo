"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AddToCartButtonProps = {
  product: {
    id: string
    name: string
    price: number
    image?: string
    slug: string
  }
  className?: string
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export default function AddToCartButton({ 
  product, 
  className, 
  variant = "default", 
  size = "default",
  children = "AÑADIR AL CARRITO"
}: AddToCartButtonProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Add to cart functionality with localStorage
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
      quantity: 1,
      addedAt: new Date().toISOString()
    }
    
    // Get existing cart from localStorage
    const existingCart = localStorage.getItem('cart')
    let cart: any[] = []
    
    try {
      if (existingCart) {
        const parsedCart = JSON.parse(existingCart)
        // Ensure cart is an array
        cart = Array.isArray(parsedCart) ? parsedCart : []
      }
    } catch (error) {
      // If parsing fails, start with empty cart
      console.warn('Failed to parse cart from localStorage:', error)
      cart = []
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex((item: any) => item.id === product.id)
    
    if (existingItemIndex > -1) {
      // If item exists, increase quantity
      cart[existingItemIndex].quantity += 1
    } else {
      // If item doesn't exist, add new item
      cart.push(cartItem)
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart))
    
    // Dispatch custom event to update cart counter
    window.dispatchEvent(new Event('cartUpdated'))
    
    // Optional: Show success message or update UI
    console.log('Producto añadido al carrito:', product.name)
  }

  return (
    <Button 
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleAddToCart}
    >
      {children}
    </Button>
  )
}
