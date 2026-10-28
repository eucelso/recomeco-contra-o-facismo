import type { Metadata } from "next";
import { JobForm } from "@/components/employer/job-form";
import { PageTitle } from "@/components/layout/app-shell";
import { requireEmployer } from "@/lib/employer";

export const metadata: Metadata = { title: "Nova vaga" };

export default async function NovaVagaPage() {
  const { employer } = await requireEmployer();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle kicker="Nova vaga">O que você precisa?</PageTitle>
      <JobForm verified={employer.verification_status === "verified"} defaultCity={employer.city} defaultState={employer.state} />
    </div>
  );
}
