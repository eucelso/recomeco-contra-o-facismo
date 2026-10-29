"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ChevronLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { saveEmployer } from "@/app/cadastro/contratante/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMMITMENT_ITEMS, STATES } from "@/lib/constants";
import { employerSchema, onlyDigits } from "@/lib/validation";
import { cn } from "@/lib/utils";

const SECTORS = [
  "Agricultura familiar e alimentos",
  "Comércio e varejo",
  "Restaurantes e alimentação",
  "Indústria",
  "Construção",
  "Saúde e cuidado",
  "Educação",
  "Serviços gerais",
  "Tecnologia",
  "Cultura e comunicação",
  "Cooperativa",
  "Outro",
];

export function maskDoc(kind: "cnpj" | "cpf", raw: string) {
  const d = onlyDigits(raw).slice(0, kind === "cnpj" ? 14 : 11);
  if (kind === "cpf") return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

type Values = z.input<typeof employerSchema>;

export function EmployerForm({ initial }: { initial: Omit<Values, "commitment"> | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<Values, unknown, z.output<typeof employerSchema>>({
    resolver: zodResolver(employerSchema),
    defaultValues: {
      kind: initial?.kind ?? "cnpj",
      document: initial ? maskDoc(initial.kind, initial.document) : "",
      display_name: initial?.display_name ?? "",
      legal_name: initial?.legal_name ?? "",
      sector: initial?.sector ?? "",
      city: initial?.city ?? "",
      state: initial?.state,
      responsible_name: initial?.responsible_name ?? "",
      commitment: undefined as unknown as true,
    },
  });
  const kind = form.watch("kind");

  const submit = form.handleSubmit((v) =>
    start(async () => {
      const r = await saveEmployer(v);
      if (!r.ok) {
        if (r.field === "document") form.setError("document", { message: r.error });
        else toast.error(r.error);
        return;
      }
      router.push("/contratante/verificacao");
      router.refresh();
    }),
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex h-[60px] items-center justify-between border-b-3 border-foreground px-2">
        <Link href="/" aria-label="Voltar" className="flex size-11 items-center justify-center">
          <ChevronLeft className="size-7" strokeWidth={3} />
        </Link>
        <span className="text-[13px] font-black uppercase tracking-wider">Conta de contratante</span>
        <span className="w-11" />
      </header>
      <main id="conteudo" className="flex flex-col gap-6 px-4 pb-12 pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[42px] uppercase leading-[0.98]">
            Quem está <span className="text-primary">contratando?</span>
          </h1>
          <p className="text-base font-medium leading-relaxed">
            Verificamos todo contratante antes de liberar o acesso a candidatos. Isso protege quem já foi perseguido.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel id="kind-label">Você contrata como</FormLabel>
                  <div role="radiogroup" aria-labelledby="kind-label" className="grid grid-cols-2 border-3 border-foreground">
                    {(["cnpj", "cpf"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={field.value === k}
                        onClick={() => {
                          field.onChange(k);
                          form.setValue("document", "");
                        }}
                        className={cn(
                          "h-12 text-sm font-black uppercase",
                          field.value === k ? "bg-secondary text-secondary-foreground" : "bg-background",
                        )}
                      >
                        {k === "cnpj" ? "Empresa · CNPJ" : "Autônomo · CPF"}
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{kind === "cnpj" ? "CNPJ" : "CPF"}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder={kind === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                      {...field}
                      onChange={(e) => field.onChange(maskDoc(kind, e.target.value))}
                    />
                  </FormControl>
                  {kind === "cpf" && <FormDescription>Seu CPF nunca aparece nas vagas.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome que aparece nas vagas</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Cooperativa Mãos da Terra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {kind === "cnpj" && (
              <FormField
                control={form.control}
                name="legal_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Razão social <span className="font-semibold normal-case">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o setor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="responsible_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pessoa responsável</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormDescription>Quem responde pelo compromisso e pelas mensagens.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <section aria-labelledby="comp-title" className="mr-1.5 flex flex-col gap-4 border-3 border-foreground bg-accent p-4 text-accent-foreground shadow-hard sm:p-5">
              <h2 id="comp-title" className="font-display text-[28px] uppercase leading-none">
                Compromisso de Contratação Justa
              </h2>
              <ol className="flex flex-col gap-2.5 text-[15px] font-semibold leading-snug">
                {COMMITMENT_ITEMS.map((c, i) => (
                  <li key={c} className="flex gap-2.5">
                    <span className="font-display text-xl leading-tight">{i + 1}</span>
                    {c}
                  </li>
                ))}
              </ol>
              <FormField
                control={form.control}
                name="commitment"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className={cn("flex items-start gap-3 border-3 bg-card p-3 text-card-foreground", fieldState.error ? "border-destructive" : "border-foreground")}>
                      <FormControl>
                        <Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true ? true : undefined)} className="mt-0.5" />
                      </FormControl>
                      <FormLabel className="text-[15px] font-bold normal-case leading-snug">
                        Li e assumo o Compromisso de Contratação Justa em nome da organização.
                      </FormLabel>
                    </div>
                    <FormMessage className="text-[#5E0A14]" />
                  </FormItem>
                )}
              />
            </section>

            <Alert variant="ink">
              <Clock aria-hidden="true" />
              <p>A verificação leva até 2 dias úteis. Enquanto isso, você já pode rascunhar vagas, mas não vê candidatos.</p>
            </Alert>

            <div className="pr-1.5">
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? "Enviando…" : initial ? "Salvar alterações" : "Enviar para verificação"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
