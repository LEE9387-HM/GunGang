import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../infra/db/types";

type DB = SupabaseClient<Database>;

export type ConsentKind = "terms_privacy" | "health_data";

/**
 * 동의 기록. 개인정보 보호법 제23조①1호 — 민감정보(health_data)는 "다른 개인정보의
 * 처리에 대한 동의와 별도로" 받아야 하므로 kind로 구분해 별개 행에 저장한다.
 */
export async function recordConsent(sb: DB, userId: string, kind: ConsentKind): Promise<void> {
  const { error } = await sb
    .from("user_consent")
    .upsert({ user_id: userId, kind, agreed_at: new Date().toISOString() }, { onConflict: "user_id,kind" });
  if (error) throw new Error(`동의 기록 실패: ${error.message}`);
}

export async function hasConsent(sb: DB, userId: string, kind: ConsentKind): Promise<boolean> {
  const { data } = await sb
    .from("user_consent")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();
  return data != null;
}
