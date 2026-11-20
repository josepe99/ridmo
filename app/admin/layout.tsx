import type React from "react"
import { requireAdminPage } from '@/modules/users/server'
import Link from "next/link"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, Settings, Package, ShoppingBag, Users } from "lucide-react"
import { EnableNotificationsButton } from "@/modules/notifications"
import { getVapidPublicKey } from "@/modules/notifications/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminPage()

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a la tienda
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Panel de administración</h1>
              </div>
            </div>
            <EnableNotificationsButton vapidPublicKey={getVapidPublicKey()} />
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:gap-6 sm:px-0 md:gap-8">
            <Link
              href="/admin"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              <Package className="h-4 w-4" />
              Colecciones
            </Link>
            <Link
              href="/admin/orders"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              <ShoppingBag className="h-4 w-4" />
              Pedidos
            </Link>
            <Link
              href="/admin/users"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              <Users className="h-4 w-4" />
              Usuarios
            </Link>
            {/* Add more admin navigation items here as needed */}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
