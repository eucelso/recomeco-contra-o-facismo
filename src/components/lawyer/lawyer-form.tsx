"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ChevronLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { saveLawyer } from "@/app/cadastro/advogado/actions";
import { ChipGroup } from "@/components/forms/chip-group";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LAWYER_COMMITMENT_ITEMS, LEGAL_AREAS, STATES } from "@/lib/constants";
import { lawyerSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Values = z.input<typeof lawyerSchema>;

function UfSelect({ value, onChange, placeholder }: { value: string | undefined; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
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
  );
}

export function LawyerForm({ initial }: { initial: Omit<Values, "commitment"> | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<Values, unknown, z.output<typeof lawyerSchema>>({
    resolver: zodResolver(lawyerSchema),
    defaultValues: {
      full_name: initial?.full_name ?? "",
      oab_state: initial?.oab_state,
      oab_number: initial?.oab_number ?? "",
      areas: initial?.areas ?? [],
      city: initial?.city ?? "",
      state: initial?.state,
      online: initial?.online ?? true,
      contact_kind: initial?.contact_kind ?? "whatsapp",
      contact_value: initial?.contact_value ?? "",
      bio: initial?.bio ?? "",
      commitment: undefined as unknown as true,
    },
  });
  const kind = form.watch("contact_kind");

  const submit = form.handleSubmit((v) =>
    start(async () => {
      const r = await saveLawyer(v);
      if (!r.ok) {
        if (r.field === "oab_number") form.setError("oab_number", { message: r.error });
        else toast.error(r.error);
        return;
      }
      router.push("/advogado");
      router.refresh();
    }),
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex h-[60px] items-center justify-between border-b-3 border-foreground px-2">
        <Link href="/" aria-label="Voltar" className="flex size-11 items-center justify-center">
          <ChevronLeft className="size-7" strokeWidth={3} />
        </Link>
        <span className="text-[13px] font-black uppercase tracking-wider">Conta de advogado(a)</span>
        <span className="w-11" />
      </header>
      <main id="conteudo" className="flex flex-col gap-6 px-4 pb-12 pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[42px] uppercase leading-[0.98]">
            Quer <span className="text-primary">ajudar?</span>
          </h1>
          <p className="text-base font-medium leading-relaxed">
            Conferimos a sua inscrição na OAB antes de colocar você na lista pública. Quem procura ajuda fala direto com você.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
              <FormField
                control={form.control}
                name="oab_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OAB/UF</FormLabel>
                    <UfSelect value={field.value} onChange={field.onChange} placeholder="UF" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oab_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da OAB</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="areas"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel id="areas-label">Em que áreas você pode ajudar? (até 5)</FormLabel>
                  <ChipGroup options={LEGAL_AREAS} value={field.value} onChange={field.onChange} max={5} invalid={Boolean(fieldState.error)} ariaLabelledBy="areas-label" />
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
                    <UfSelect value={field.value} onChange={field.onChange} placeholder="UF" />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="online"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 border-3 border-foreground bg-card p-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                    </FormControl>
                    <FormLabel className="text-[15px] font-bold normal-case leading-snug">Também atendo online, em qualquer cidade.</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel id="contact-label">Como as pessoas vão falar com você?</FormLabel>
                  <div role="radiogroup" aria-labelledby="contact-label" className="grid grid-cols-2 border-3 border-foreground">
                    {(["whatsapp", "email"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={field.value === k}
                        onClick={() => {
                          field.onChange(k);
                          form.setValue("contact_value", "");
                        }}
                        className={cn("h-12 text-sm font-black uppercase", field.value === k ? "bg-secondary text-secondary-foreground" : "bg-background")}
                      >
                        {k === "whatsapp" ? "WhatsApp" : "E-mail"}
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{kind === "whatsapp" ? "WhatsApp com DDD" : "E-mail de contato"}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode={kind === "whatsapp" ? "tel" : "email"}
                      placeholder={kind === "whatsapp" ? "11 91234-5678" : "nome@escritorio.com"}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Esse contato aparece na lista pública, para qualquer pessoa ver. Use um que você já divulga.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Apresentação <span className="font-semibold normal-case">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={4} className="min-h-[110px]" placeholder="Em poucas palavras: como você pode ajudar." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <section aria-labelledby="comp-title" className="mr-1.5 flex flex-col gap-4 border-3 border-foreground bg-accent p-4 text-accent-foreground shadow-hard sm:p-5">
              <h2 id="comp-title" className="font-display text-[28px] uppercase leading-none">
                Compromisso do advogado voluntário
              </h2>
              <ol className="flex flex-col gap-2.5 text-[15px] font-semibold leading-snug">
                {LAWYER_COMMITMENT_ITEMS.map((c, i) => (
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
                      <FormLabel className="text-[15px] font-bold normal-case leading-snug">Li e assumo o compromisso do advogado voluntário.</FormLabel>
                    </div>
                    <FormMessage className="text-[#5E0A14]" />
                  </FormItem>
                )}
              />
            </section>

            <Alert variant="ink">
              <Clock aria-hidden="true" />
              <p>Conferimos a OAB em até 2 dias úteis. Seu nome só aparece na lista pública depois da aprovação.</p>
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
