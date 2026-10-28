import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatRoom } from "@/components/chat/chat-room";
import { requireRole } from "@/lib/auth";
import type { Message } from "@/lib/types";

export const metadata: Metadata = { title: "Conversa", robots: { index: false } };

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase, user } = await requireRole();

  const { data: contact } = await supabase.from("contact_requests").select("id,status,job_id,responded_at,candidate_id").eq("id", id).maybeSingle();
  if (!contact || contact.status !== "accepted") notFound();

  const [{ data: peer }, { data: messages }, { data: job }] = await Promise.all([
    supabase.rpc("conversation_peer", { p_contact: id }),
    supabase.from("messages").select("*").eq("contact_id", id).order("created_at", { ascending: true }).limit(200),
    contact.job_id ? supabase.from("jobs").select("title,city,state").eq("id", contact.job_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  await supabase.rpc("mark_conversation_read", { p_contact: id });

  return (
    <ChatRoom
      contactId={id}
      userId={user.id}
      peer={(peer as { name: string; verified?: boolean; kind: string }) ?? { name: "Conversa", kind: "employer" }}
      jobLabel={job ? `${job.title}${job.city ? ` · ${job.city}, ${job.state}` : ""}` : null}
      acceptedAt={contact.responded_at}
      isCandidate={contact.candidate_id === user.id}
      initial={(messages ?? []) as Message[]}
    />
  );
}
