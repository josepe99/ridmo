import path from "node:path"
import { defineConfig } from "vitest/config"

const root = import.meta.dirname
const rootPosix = root.split(path.sep).join("/")

// Two projects share one config:
//  - "server": *.test.ts in the Node environment (services, actions, domain, route handlers).
//  - "ui": *.test.tsx in jsdom (components and hooks).
// No test may reach a real database: Prisma is always mocked (see tests/mocks/prisma.ts).
export default defineConfig({
  resolve: {
    alias: [
      // `server-only` throws outside a React Server environment; make it a no-op.
      { find: /^server-only$/, replacement: path.resolve(root, "tests/mocks/server-only.ts") },
      { find: /^@\//, replacement: `${rootPosix}/` },
    ],
  },
  test: {
    unstubEnvs: true,
    unstubGlobals: true,
    // next-auth (ESM) imports "next/server" without an extension, which Node cannot resolve;
    // letting Vite process it makes the auth stack importable in tests.
    server: { deps: { inline: [/next-auth/, /@auth\/core/] } },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["modules/**/*.{ts,tsx}", "shared/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "public/sw.js"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "tests/**",
        // Barrels and type-only files carry no behavior.
        "**/index.ts",
        "**/server.ts",
        "**/types.ts",
        // Layout shells: wiring only, no logic of their own.
        "shared/layout/main-nav.tsx",
        "app/layout.tsx",
        "app/admin/layout.tsx",
        "app/admin/page.tsx",
        "app/admin/collections/[[]collectionId]/page.tsx",
        "app/admin/orders/**",
        // Route handlers whose only logic is the admin gate + delegation to a tested controller.
        "app/api/admin/images/route.ts",
        "app/api/admin/items/route.ts",
        "app/api/admin/items/[[]id]/route.ts",
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: ["**/node_modules/**", ".next/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["**/*.test.tsx"],
          exclude: ["**/node_modules/**", ".next/**"],
        },
      },
    ],
  },
})
