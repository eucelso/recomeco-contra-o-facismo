import { JobSkeleton } from "@/components/jobs/job-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[44px] uppercase leading-none">Vagas</h1>
      <div className="h-[54px] border-3 border-foreground bg-white" />
      <JobSkeleton />
    </div>
  );
}
