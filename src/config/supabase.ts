import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
};

export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  clientOptions
);

export const supabaseAuth = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  clientOptions
);
