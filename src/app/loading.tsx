import { PageSkeleton } from "@/components/layout/page-skeleton";

// Cobre a troca entre seções, quando o layout da próxima ainda está sendo montado.
export default function Loading() {
  return (
    <>
      <div className="h-14 border-b-3 border-foreground bg-background md:h-16" />
      <main className="mx-auto w-full max-w-2xl px-4 pt-5 md:pt-8">
        <PageSkeleton />
      </main>
    </>
  );
}
