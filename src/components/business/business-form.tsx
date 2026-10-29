"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ChevronLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { saveBusiness } from "@/app/cadastro/negocio/actions";
import { maskDoc } from "@/components/onboarding/employer-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_CATEGORIES, BUSINESS_COMMITMENT_ITEMS, STATES } from "@/lib/constants";
import { businessSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Values = z.input<typeof businessSchema>;

export function BusinessForm({ initial }: { initial: Omit<Values, "commitment"> | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<Values, unknown, z.output<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      kind: initial?.kind ?? "cnpj",
      document: initial ? maskDoc(initial.kind, initial.document) : "",
      display_name: initial?.display_name ?? "",
      category: initial?.category as Values["category"],
      city: initial?.city ?? "",
      state: initial?.state,
      neighborhood: initial?.neighborhood ?? "",
      address: initial?.address ?? "",
      whatsapp: initial?.whatsapp ?? "",
      instagram: initial?.instagram ?? "",
      website: initial?.website ?? "",
      hours: initial?.hours ?? "",
      story: initial?.story ?? "",
      commitment: undefined as unknown as true,
    },
  });
  const kind = form.watch("kind");
  const storyLen = form.watch("story")?.length ?? 0;

  const submit = form.handleSubmit((v) =>
    start(async () => {
      const r = await saveBusiness(v);
      if (!r.ok) {
        if (r.field === "document") form.setError("document", { message: r.error });
        else toast.error(r.error);
        return;
      }
      router.push("/negocio");
      router.refresh();
    }),
  );

  const text = (name: keyof Values, label: string, props: React.ComponentProps<typeof Input> = {}, hint?: string, optional = true) => (
    <FormField
      control={form.control}
      name={name as "display_name"}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {optional && <span className="font-semibold normal-case">(opcional)</span>}
          </FormLabel>
          <FormControl>
            <Input {...props} {...field} value={(field.value as string | undefined) ?? ""} />
          </FormControl>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex h-[60px] items-center justify-between border-b-3 border-foreground px-2">
        <Link href="/" aria-label="Voltar" className="flex size-11 items-center justify-center">
          <ChevronLeft className="size-7" strokeWidth={3} />
        </Link>
        <span className="text-[13px] font-black uppercase tracking-wider">Conta de negócio</span>
        <span className="w-11" />
      </header>
      <main id="conteudo" className="flex flex-col gap-6 px-4 pb-12 pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[42px] uppercase leading-[0.98]">
            Seu negócio <span className="text-primary">merece apoio</span>
          </h1>
          <p className="text-base font-medium leading-relaxed">
            Foi prejudicado por boicote ou perseguição? Divulgue aqui para as pessoas perto de você conhecerem e apoiarem. A equipe confere os dados antes de publicar.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel id="kind-label">O negócio é registrado como</FormLabel>
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
                        className={cn("h-12 text-sm font-black uppercase", field.value === k ? "bg-secondary text-secondary-foreground" : "bg-background")}
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
                  <FormDescription>Usamos só para conferir que o negócio existe. Nunca aparece na lista pública.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {text("display_name", "Nome do negócio", { placeholder: "Ex.: Padaria do Bairro" }, undefined, false)}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
              {text("city", "Cidade", {}, undefined, false)}
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
            {text("neighborhood", "Bairro")}
            {text("address", "Endereço", {}, "Opcional. Só preencha se quiser receber visitas.")}
            {text("hours", "Horário de funcionamento", { placeholder: "Seg a sáb, 8h às 18h" })}

            <fieldset className="flex flex-col gap-4 border-3 border-foreground p-4">
              <legend className="px-1 text-sm font-black uppercase">Contato (pelo menos um)</legend>
              {text("whatsapp", "WhatsApp com DDD", { inputMode: "tel", placeholder: "11 91234-5678" })}
              {text("instagram", "Instagram", { placeholder: "padariadobairro" }, "Só o nome de usuário, sem link.")}
              {text("website", "Site", { inputMode: "url", placeholder: "https://meusite.com.br" })}
              <p className="text-xs font-semibold">Esses contatos aparecem na lista pública, para qualquer pessoa ver.</p>
            </fieldset>

            <FormField
              control={form.control}
              name="story"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que aconteceu com o seu negócio?</FormLabel>
                  <FormControl>
                    <Textarea rows={5} className="min-h-[130px]" placeholder="Ex.: Perdemos clientes depois de uma campanha de boicote nas redes." {...field} />
                  </FormControl>
                  <FormDescription>
                    Conte só o que aconteceu com o negócio. Não cite nomes de pessoas nem acuse ninguém. ({storyLen}/500)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <section aria-labelledby="comp-title" className="mr-1.5 flex flex-col gap-4 border-3 border-foreground bg-accent p-4 text-accent-foreground shadow-hard sm:p-5">
              <h2 id="comp-title" className="font-display text-[28px] uppercase leading-none">
                Declaração do negócio
              </h2>
              <ol className="flex flex-col gap-2.5 text-[15px] font-semibold leading-snug">
                {BUSINESS_COMMITMENT_ITEMS.map((c, i) => (
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
                      <FormLabel className="text-[15px] font-bold normal-case leading-snug">Li e concordo com a declaração acima.</FormLabel>
                    </div>
                    <FormMessage className="text-[#5E0A14]" />
                  </FormItem>
                )}
              />
            </section>

            <Alert variant="ink">
              <Clock aria-hidden="true" />
              <p>A equipe confere o documento e revisa o texto em até 2 dias úteis. Seu negócio só aparece na lista pública depois da aprovação.</p>
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
