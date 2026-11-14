// Settings that are safe to read from client code.
// Keep this file free of validation side effects: shared/lib/settings.ts validates
// server env vars at import time in development and must never reach the browser.

/**
 * Business WhatsApp number (digits, with country code) used for contact links such as
 * "send the transfer proof". Only NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER is inlined into
 * client bundles; the server-side fallback applies when this is evaluated on the server.
 */
export const WHATSAPP_CONTACT_PHONE_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || process.env.WHATSAPP_PHONE_NUMBER || '';
