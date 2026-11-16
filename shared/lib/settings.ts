// Environment variables configuration - Direct exports

// Authentication (Auth.js): AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are read by
// Auth.js itself from the environment and are intentionally not re-exported here.

// Database Configuration
export const DATABASE_URL = process.env.DATABASE_URL!;

// Object storage (S3-compatible, MinIO) is read lazily through getS3Config() so that
// builds and pages that never upload files do not need the S3_* variables.
export interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  /** Public base URL of the bucket, without a trailing slash (e.g. https://media.example/bucket). */
  publicUrl: string;
}

const REQUIRED_S3_VARS = [
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_PUBLIC_URL',
] as const;

export function getS3Config(): S3Config {
  const missing = REQUIRED_S3_VARS.filter(name => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required S3 environment variables: ${missing.join(', ')}\n` +
      'Configure the MinIO/S3 settings to enable file uploads.'
    );
  }

  return {
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET!,
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    publicUrl: process.env.S3_PUBLIC_URL!.replace(/\/+$/, ''),
  };
}

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
