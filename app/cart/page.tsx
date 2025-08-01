import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"

export default function CartPage() {
  // En una implementación real, aquí iría la lógica para obtener los ítems del carrito
  const cartItems = [] // Por ahora, el carrito está vacío

  return (
    <section className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Tu Carrito de Compras</h1>
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <ShoppingBag className="h-20 w-20 text-gray-400" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Tu carrito está vacío.</p>
            <Link href="/coleccion">
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none px-8 py-3">
                Continuar Comprando
              </Button>
            </Link>
          </div>
        ) : (
          // Aquí iría la lista de productos en el carrito
          <div>
            <p className="text-lg">¡Tu carrito tiene ítems! (Implementación pendiente)</p>
            {/* Ejemplo de cómo se vería un ítem */}
            {/* <div className="border p-4 flex justify-between items-center">
              <span>Producto Ejemplo - €100.00</span>
              <Button variant="outline">Eliminar</Button>
            </div> */}
            <Button className="mt-8 bg-black text-white hover:bg-gray-800 rounded-none px-8 py-3">
              Proceder al Pago
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
