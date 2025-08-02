import type React from "react"
import { requireAdmin } from '@/lib/auth'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, Package, Users, BarChart3 } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Store
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              <Package className="h-4 w-4" />
              Collections
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
