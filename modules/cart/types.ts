/** Shape of a line stored in the browser cart (localStorage key `cart`). */
export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  slug: string
  quantity: number
  addedAt: string
}

/** Minimal product data required to add something to the cart. */
export type AddToCartProduct = {
  id: string
  name: string
  price: number
  image?: string
  slug: string
}
