/**
 * src/lib/config.ts
 * 
 * Centralized, typed configuration for the frontend with simple validation.
 * It uses NEXT_PUBLIC_ variables and throws in production if critical ones are missing.
 */
import { 
  BACKEND_URL, 
  WS_URL, 
  CLERK_PUBLISHABLE_KEY,
  IS_PROD,
  IS_DEV
} from "./env";

// 1. Validation Logic
const missingRequired = [];
if (!BACKEND_URL) missingRequired.push("NEXT_PUBLIC_BACKEND_URL");
if (!CLERK_PUBLISHABLE_KEY) missingRequired.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");

if (IS_PROD && missingRequired.length > 0) {
  throw new Error(`[FATAL] Missing required production environment variables: ${missingRequired.join(", ")}`);
} else if (IS_DEV && missingRequired.length > 0) {
  console.warn(`[WARNING] Missing environment variables: ${missingRequired.join(", ")}`);
}

// 2. Exported Config Object
export const config = {
  backendUrl: BACKEND_URL,
  wsUrl: WS_URL,
  clerkPublishableKey: CLERK_PUBLISHABLE_KEY,
  
  // App settings
  maxLogs: 200,
  refreshInterval: 30000, // 30s for metrics
  logFetchLimit: 50,
  
  isDev: IS_DEV,
  isProd: IS_PROD,
};

export default config;
