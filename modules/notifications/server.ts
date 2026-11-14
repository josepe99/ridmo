import "server-only"

// Server-only public API of the notifications module (Web Push for admins).
export { notifyNewOrder, sendPushToAdmins } from "./services/send-push"
export { getVapidPublicKey } from "./services/vapid"
export { savePushSubscriptionAction } from "./actions/save-subscription.action"
export type { SaveSubscriptionResult } from "./actions/save-subscription.action"
