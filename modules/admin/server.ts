import "server-only"

// Server-only public API of the admin module: server actions and HTTP controllers.
// The client-safe API (components + types) lives in ./index.ts.
export * from "./actions/collections.actions"
export * from "./actions/items.actions"
export * from "./actions/file.actions"
export { CollectionController } from "./services/controllers/collection.controller"
export { ItemController } from "./services/controllers/item.controller"
export { ImageController } from "./services/controllers/image.controller"
