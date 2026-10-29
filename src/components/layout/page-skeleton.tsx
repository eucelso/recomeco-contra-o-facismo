import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto mostrado enquanto o servidor monta a página: o clique responde na hora. */
export function PageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Carregando…</span>
      <Skeleton className="h-11 w-2/3 border-3 border-foreground" />
      <Skeleton className="h-[54px] w-full border-3 border-foreground" />
      <Skeleton className="h-32 w-full border-3 border-foreground" />
      <Skeleton className="h-32 w-full border-3 border-foreground" />
    </div>
  );
}
