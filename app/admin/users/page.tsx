import type { Metadata } from "next"
import { UsersTable, listUsers, requireAdminPage } from "@/modules/users/server"

export const metadata: Metadata = {
  title: "Usuarios | Admin RIDMO",
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{ q?: string | string[]; page?: string | string[] }>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  // Pages re-check the role in the database even though the layout already did: a layout is
  // not re-rendered on every client navigation.
  const adminId = await requireAdminPage()

  const params = await searchParams
  const query = (first(params.q) ?? "").trim().slice(0, 100)
  const page = Number.parseInt(first(params.page) ?? "1", 10)

  const list = await listUsers({ query, page: Number.isFinite(page) ? page : 1 })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-gray-600 mt-2">
          Quién puede entrar al panel de administración. Los registros nuevos son siempre clientes: solo un
          administrador puede promover a otro usuario.
        </p>
      </div>
      <UsersTable list={list} query={query} currentUserId={adminId} />
    </div>
  )
}
