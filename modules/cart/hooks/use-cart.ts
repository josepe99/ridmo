"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { CartItem } from "../types"

const CART_STORAGE_KEY = "cart"
const CART_UPDATED_EVENT = "cartUpdated"

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch (error) {
    console.error("Error loading cart:", error)
    return []
  }
}

function writeCart(items: CartItem[]) {
  if (items.length === 0) {
    localStorage.removeItem(CART_STORAGE_KEY)
  } else {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }
  // The nav badge listens to this event.
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

/**
 * Browser cart backed by localStorage.
 *
 * The stored prices are display data only: checkout sends just `{ id, quantity }`
 * and the server prices the order from the catalog.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setItems(readCart())
    setIsLoading(false)
  }, [])

  const commit = useCallback((next: CartItem[]) => {
    setItems(next)
    writeCart(next)
  }, [])

  const removeItem = useCallback(
    (id: string) => commit(items.filter((item) => item.id !== id)),
    [items, commit]
  )

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) return removeItem(id)
      commit(items.map((item) => (item.id === id ? { ...item, quantity } : item)))
    },
    [items, commit, removeItem]
  )

  const clear = useCallback(() => commit([]), [commit])

  const totalPrice = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  )
  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  )

  return { items, isLoading, updateQuantity, removeItem, clear, totalPrice, totalQuantity }
}
