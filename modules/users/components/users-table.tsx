import Link from "next/link"
import { ROLE_LABELS } from "../domain/roles"
import type { UserList } from "../services/list-users"
import { RoleControl } from "./role-control"

type UsersTableProps = {
  list: UserList
  query: string
  currentUserId: string
}

const dateFormat = new Intl.DateTimeFormat("es-PY", { dateStyle: "medium" })

function pageHref(query: string, page: number): string {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return qs ? `/admin/users?${qs}` : "/admin/users"
}

/** Server-rendered admin table with email search and pagination. */
export function UsersTable({ list, query, currentUserId }: UsersTableProps) {
  return (
    <div>
      <form action="/admin/users" method="get" role="search" className="mb-6 flex flex-wrap gap-2 sm:flex-nowrap">
        <label htmlFor="users-search" className="sr-only">
          Buscar por correo electrónico
        </label>
        <input
          id="users-search"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={100}
          placeholder="Buscar por correo electrónico"
          className="min-h-10 min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2 text-sm sm:max-w-sm sm:flex-none sm:basis-full outline-none transition-colors duration-200 focus:border-black"
        />
        <button
          type="submit"
          className="min-h-10 border border-black bg-black px-4 py-2 text-[10px] font-semibold uppercase tracking-label text-white transition-colors duration-200 hover:bg-white hover:text-black"
        >
          Buscar
        </button>
      </form>

      <p className="mb-3 text-xs text-neutral-500" aria-live="polite">
        {list.total} {list.total === 1 ? "usuario" : "usuarios"}
      </p>

      <div className="border border-neutral-200 bg-white md:overflow-x-auto">
        {/* Below md the rows reflow into stacked cards (same DOM, CSS only); from md up it is a regular table. */}
        <table className="w-full text-left text-sm max-md:block md:min-w-[640px]">
          <thead className="max-md:sr-only border-b border-neutral-200 text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3">Usuario</th>
              <th scope="col" className="px-4 py-3">Rol</th>
              <th scope="col" className="px-4 py-3">Registro</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="max-md:block">
            {list.users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-neutral-100 last:border-0 max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:items-center max-md:gap-x-4 max-md:gap-y-3 max-md:px-4 max-md:py-4"
              >
                <td className="px-4 py-3 max-md:col-span-2 max-md:p-0">
                  <div className="break-all font-medium text-neutral-900">{user.email}</div>
                  <div className="text-xs text-neutral-500">
                    {user.name ?? "Sin nombre"}
                    {user.hasGoogle ? " · Google" : ""}
                    {user.disabled ? " · Deshabilitado" : ""}
                  </div>
                </td>
                <td className="px-4 py-3 max-md:p-0">{ROLE_LABELS[user.role]}</td>
                <td className="px-4 py-3 text-neutral-600 max-md:p-0 max-md:text-right max-md:text-xs">{dateFormat.format(new Date(user.createdAt))}</td>
                <td className="px-4 py-3 max-md:col-span-2 max-md:p-0">
                  <RoleControl userId={user.id} role={user.role} isSelf={user.id === currentUserId} />
                </td>
              </tr>
            ))}
            {list.users.length === 0 ? (
              <tr className="max-md:block">
                <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                  No encontramos usuarios.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {list.pageCount > 1 ? (
        <nav aria-label="Paginación" className="mt-6 flex items-center justify-between gap-2 text-sm">
          {list.page > 1 ? (
            <Link href={pageHref(query, list.page - 1)} className="inline-flex min-h-10 items-center underline underline-offset-4">
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-500">
            Página {list.page} de {list.pageCount}
          </span>
          {list.page < list.pageCount ? (
            <Link href={pageHref(query, list.page + 1)} className="inline-flex min-h-10 items-center underline underline-offset-4">
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  )
}
