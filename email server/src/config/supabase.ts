import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// In local development, if running from the 'email server' subfolder, the .env is in the parent directory
if (!process.env.SUPABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseSecretKey) {
  console.warn('Warning: Supabase credentials missing on the email server. Database operations may fail.');
}

let clientInstance: any = null;

export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Supabase client is not initialized. Please set SUPABASE_URL and SUPABASE_SECRET_KEY environment variables.');
    }
    if (!clientInstance) {
      clientInstance = createClient(supabaseUrl, supabaseSecretKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }
    return Reflect.get(clientInstance, prop);
  }
}) as ReturnType<typeof createClient>;

