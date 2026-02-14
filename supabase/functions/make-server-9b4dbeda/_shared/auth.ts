import { getSupabaseClient } from "./database.ts";

export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseClient(token);

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Invalid token");
  }

  return { user, supabase };
}

export function hasRole(user: any, role: string): boolean {
  return user?.user_metadata?.role === role || 
         user?.app_metadata?.role === role;
}

export function isStaffOrAdmin(user: any): boolean {
  const role = user?.user_metadata?.role || user?.app_metadata?.role;
  return ['staff', 'admin', 'superadmin'].includes(role);
}