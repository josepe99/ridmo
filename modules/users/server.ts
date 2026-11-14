import "server-only"

// Server-only public API of the users module (Auth.js backed guards, actions and queries).
// The client-safe API (forms, session UI) lives in ./index.ts.
//
// Guards, in order of use:
//  - requireAdmin():     server actions and route handlers. Throws AuthorizationError.
//  - requireAdminPage(): pages and layouts. Redirects instead of throwing.
//  - requireUserPage():  pages that need any signed-in user.
//  - getCurrentUser():   optional session (null for guests).
// All of them read the user's role from the database, never from the token.
export { requireAdmin, requireUser, getCurrentUser } from "./services/current-user"
export type { CurrentUser } from "./services/current-user"
export { requireAdminPage, requireUserPage } from "./services/page-guards"
export { AuthorizationError, isAuthorizationError, authorizationErrorResponse } from "./errors"
export { listUsers } from "./services/list-users"
export type { UserList, UserListItem } from "./services/list-users"
export { setUserRoleAction } from "./actions/set-user-role.action"
export type { SetUserRoleResult } from "./actions/set-user-role.action"
export { UsersTable } from "./components/users-table"
