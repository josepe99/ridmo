// Client-safe public API of the users module (forms, session UI, pure helpers).
// Server-side guards, actions and queries live in ./server.ts.
export { SignInForm } from "./components/sign-in-form"
export { SignUpForm } from "./components/sign-up-form"
export { UserMenu } from "./components/user-menu"
export { AuthSessionProvider } from "./components/auth-session-provider"
export { sanitizeCallbackUrl } from "./domain/callback-url"
export { authErrorMessage } from "./domain/auth-errors"
export { isGoogleConfigured } from "./domain/google-config"
export { ROLE_LABELS } from "./domain/roles"
export type { Role } from "./domain/roles"
