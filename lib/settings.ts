// Environment variables configuration - Direct exports

// Clerk Configuration
export const NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
export const NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/';
export const NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/';
export const NEXT_PUBLIC_CLERK_SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
export const NEXT_PUBLIC_CLERK_SIGN_UP_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up';

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

// Validation function to ensure all required environment variables are set
export function validateEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
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
