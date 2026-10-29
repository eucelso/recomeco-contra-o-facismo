"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAccountAsAdmin, setSuspension } from "@/app/admin/contas/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountRow } from "@/lib/admin-accounts";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const date = (d: string) => new Date(d).toLocaleDateString("pt-BR");

const VARIANT: Record<string, "success" | "accent" | "destructive" | "dashed"> = {
  verified: "success",
  complete: "success",
  pending: "accent",
  incomplete: "dashed",
  rejected: "destructive",
  suspended: "destructive",
};

function DeleteControl({ row }: { row: AccountRow }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const ready = text.trim().toUpperCase() === "EXCLUIR";
  const run = () =>
    start(async () => {
      const r = await deleteAccountAsAdmin(row.id, text);
      if (!r.ok) return void toast.error(r.error);
      toast.success("Conta excluída.");
    });

  if (!open)
    return (
      <Button variant="ghost" size="sm" className="self-start px-0 text-destructive underline" onClick={() => setOpen(true)}>
        Excluir conta
      </Button>
    );
  return (
    <div className="flex flex-col gap-2 border-3 border-destructive p-3">
      <p className="text-sm font-bold">
        Excluir {row.email} de vez? Apaga o perfil, o cadastro, as vagas, as mensagens e tudo ligado a essa conta. Não dá para desfazer.
      </p>
      <label htmlFor={`del-${row.id}`} className="text-xs font-black uppercase">
        Digite EXCLUIR para confirmar
      </label>
      <Input id={`del-${row.id}`} autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} placeholder="EXCLUIR" />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => (setOpen(false), setText(""))}>
          Cancelar
        </Button>
        <Button variant="destructive" size="sm" className="flex-1 shadow-none" disabled={!ready || pending} onClick={run}>
          {pending ? "Excluindo…" : "Excluir tudo"}
        </Button>
      </div>
    </div>
  );
}

function SuspendControl({ row }: { row: AccountRow }) {
  if (!row.kind) return null;
  return <SuspendInner row={row} kind={row.kind} />;
}

function SuspendInner({ row, kind }: { row: AccountRow; kind: NonNullable<AccountRow["kind"]> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const run = (suspend: boolean) =>
    start(async () => {
      const r = await setSuspension(kind, row.id, suspend, reason);
      if (!r.ok) return void toast.error(r.error);
      toast.success(suspend ? "Conta oculta da plataforma." : "Conta voltou a ser exibida.");
      setOpen(false);
      setReason("");
    });

  if (row.suspended)
    return (
      <div className="flex flex-col gap-2 border-t-2 border-foreground pt-2">
        <p className="text-sm font-semibold">
          Oculta {row.suspendedAt ? `desde ${date(row.suspendedAt)}` : ""}
          {row.suspensionReason ? ` — motivo: ${row.suspensionReason}` : ""}
        </p>
        <Button variant="outline" size="sm" className="self-start shadow-none" disabled={pending} onClick={() => run(false)}>
          Voltar a exibir
        </Button>
      </div>
    );
  if (!open)
    return (
      <Button variant="ghost" size="sm" className="self-start px-0 text-destructive underline" onClick={() => setOpen(true)}>
        Ocultar da plataforma
      </Button>
    );
  return (
    <div className="flex flex-col gap-2 border-t-2 border-foreground pt-2">
      <label htmlFor={`why-${row.id}`} className="text-xs font-black uppercase">
        Motivo (a pessoa vê no painel dela)
      </label>
      <Input id={`why-${row.id}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Ex.: dados não conferem" />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button size="sm" className="flex-1 shadow-none" disabled={pending} onClick={() => run(true)}>
          Ocultar
        </Button>
      </div>
    </div>
  );
}

export function AccountList({ rows }: { rows: AccountRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const statuses = useMemo(() => {
    const m = new Map<string, { label: string; n: number }>();
    for (const r of rows) m.set(r.status, { label: r.statusLabel, n: (m.get(r.status)?.n ?? 0) + 1 });
    return [...m.entries()];
  }, [rows]);

  const list = useMemo(() => {
    const n = norm(q.trim());
    return rows.filter(
      (r) => (!status || r.status === status) && (!n || norm(r.name).includes(n) || norm(r.email).includes(n) || r.details.some(([, v]) => norm(v).includes(n))),
    );
  }, [rows, q, status]);

  const field = "h-12 w-full border-3 border-foreground bg-card px-3 text-sm font-bold";
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <label className="flex flex-col gap-1 text-xs font-black uppercase">
          Buscar
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, e-mail, cidade…" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-black uppercase">
          Situação
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
            <option value="">Todas ({rows.length})</option>
            {statuses.map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} ({v.n})
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm font-semibold" aria-live="polite">
        {list.length} de {rows.length}
      </p>
      {list.length === 0 ? (
        <p className="border-3 border-dashed border-foreground p-6 text-center font-semibold">Nada encontrado.</p>
      ) : (
        <ul className="flex flex-col gap-3 pr-1.5">
          {list.map((r) => (
            <li key={r.id} className={`flex flex-col gap-2 border-3 border-foreground p-4 shadow-hard-sm ${r.suspended ? "bg-muted opacity-90" : "bg-card"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <strong className="text-base font-black leading-tight">{r.name}</strong>
                  <span className="break-all text-[13px] font-semibold">{r.email}</span>
                </div>
                <Badge variant={VARIANT[r.status] ?? "dashed"}>{r.statusLabel}</Badge>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
                {r.details.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-black uppercase">{k}</dt>
                    <dd className="break-words">{v}</dd>
                  </div>
                ))}
                <dt className="font-black uppercase">Criada</dt>
                <dd>{date(r.created_at)}</dd>
                <dt className="font-black uppercase">Último acesso</dt>
                <dd>{r.last_sign_in_at ? date(r.last_sign_in_at) : "Nunca entrou"}</dd>
              </dl>
              <SuspendControl row={r} />
              <DeleteControl row={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
