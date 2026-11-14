// Environment variables configuration - Direct exports

// Authentication (Auth.js): AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are read by
// Auth.js itself from the environment and are intentionally not re-exported here.

// Database Configuration
export const DATABASE_URL = process.env.DATABASE_URL!;

// Cloudinary Configuration
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;

// Application Configuration
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// WhatsApp Configuration
export const WHATSAPP_PHONE_NUMBER = process.env.WHATSAPP_PHONE_NUMBER || '';
export const NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '';

// Validation function to ensure all required environment variables are set
export function validateEnvironmentVariables() {
  const requiredVars = [
    'AUTH_SECRET',
    'DATABASE_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

// Call validation in development
if (process.env.NODE_ENV === 'development') {
  validateEnvironmentVariables();
}
