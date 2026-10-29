"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { throttleBucket } from "@/lib/report-bucket";

export async function flagReport(id: string): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false };
  const { error } = await createPublicClient().rpc("flag_public_report", { p_id: id, p_bucket: await throttleBucket() });
  return { ok: !error };
}
