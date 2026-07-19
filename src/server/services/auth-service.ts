import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../infra/db/types";

type DB = SupabaseClient<Database>;

export interface SessionUser {
  id: string;
  email: string | null;
}

/** 현재 로그인한 사용자 (없으면 null). */
export async function getSessionUser(sb: DB): Promise<SessionUser | null> {
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** 현재 세션이 관리자인지 (app_admin own-row RLS로 본인 것만 조회 가능). */
export async function isAdmin(sb: DB): Promise<boolean> {
  const { data } = await sb.auth.getUser();
  if (!data.user) return false;
  const { data: row } = await sb
    .from("app_admin")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return row != null;
}
