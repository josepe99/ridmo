import { Plus } from "lucide-react"

export default function ProductServices() {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-sm font-medium">
        <Plus className="h-4 w-4" />
        Servicios RIDMO
      </div>
      <p className="mt-2 text-sm text-neutral-600">
        Envíos a todo el país y al exterior, pagos seguros y empaque exclusivo.
      </p>
    </div>
  )
}
