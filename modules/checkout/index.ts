// Client-safe public API of the checkout module (bank-transfer checkout).
// The createOrder server action and bank details are exposed through ./server.ts.
export { CheckoutFlow } from "./components/checkout-flow"
export { OrderConfirmationView } from "./components/order-confirmation-view"
export { checkoutFormSchema, createOrderInputSchema } from "./schemas/checkout.schema"
export type { CheckoutFormValues, CreateOrderInput } from "./schemas/checkout.schema"
