// Referenced from javascript_database blueprint
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon in Replit environment
// Disable SSL certificate validation for WebSocket connections
neonConfig.webSocketConstructor = class extends ws {
  constructor(address: any, protocols: any) {
    super(address, protocols, {
      rejectUnauthorized: false
    });
  }
} as any;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
