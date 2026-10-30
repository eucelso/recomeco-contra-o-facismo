import { NextResponse } from "next/server";
import { loadFacts, loadNotes } from "@/lib/dossier-server";
import { createClient } from "@/lib/supabase/server";

// Portabilidade (LGPD, art. 18): tudo o que guardamos sobre a pessoa, num JSON.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const uid = user.id;
  const [profile, candidate, experiences, reportRow, factsRes, shares, employer, lawyer, business, jobs, applications, contacts, messages, consents] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("candidates").select("*").eq("id", uid).maybeSingle(),
    supabase.from("candidate_experiences").select("*").eq("candidate_id", uid),
    supabase.from("confidential_reports").select("candidate_id,consent_at,created_at,updated_at").eq("candidate_id", uid).maybeSingle(),
    loadFacts(supabase, uid),
    supabase.from("dossier_shares").select("id,lawyer_name,has_contact,created_at,expires_at,revoked_at,first_viewed_at").eq("candidate_id", uid),
    supabase.from("employers").select("*").eq("id", uid).maybeSingle(),
    supabase.from("lawyers").select("*").eq("id", uid).maybeSingle(),
    supabase.from("businesses").select("*").eq("id", uid).maybeSingle(),
    supabase.from("jobs").select("*").eq("employer_id", uid),
    supabase.from("applications").select("*").eq("candidate_id", uid),
    supabase.from("contact_requests").select("*").or(`employer_id.eq.${uid},candidate_id.eq.${uid}`),
    supabase.from("messages").select("*").eq("sender_id", uid),
    supabase.from("consent_events").select("*").eq("user_id", uid).order("created_at"),
  ]);

  const notes = reportRow.data ? await loadNotes(supabase, uid) : null;
  const body = {
    exported_at: new Date().toISOString(),
    account: { id: uid, email: user.email, created_at: user.created_at },
    profile: profile.data,
    candidate: candidate.data,
    experiences: experiences.data,
    confidential_report: reportRow.data ? { ...reportRow.data, body: notes } : null,
    report_facts: factsRes.facts,
    dossier_shares: shares.data,
    employer: employer.data,
    lawyer: lawyer.data,
    business: business.data,
    jobs: jobs.data,
    applications: applications.data,
    contact_requests: contacts.data,
    messages_sent: messages.data,
    consents: consents.data,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="recomeco-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
