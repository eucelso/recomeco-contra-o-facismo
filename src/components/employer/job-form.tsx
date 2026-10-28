"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { createJob } from "@/app/contratante/actions";
import { ChipGroup } from "@/components/forms/chip-group";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AREAS, CONTRACT_TYPES, MODALITIES, STATES, type ContractType, type Modality } from "@/lib/constants";
import { jobSchema } from "@/lib/validation";

type Values = z.input<typeof jobSchema>;

export function JobForm({ verified, defaultCity, defaultState }: { verified: boolean; defaultCity: string; defaultState: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<Values, unknown, z.output<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      area: undefined,
      modality: "presencial",
      contract_type: "clt",
      city: defaultCity,
      state: defaultState as Values["state"],
      salary_min: "",
      salary_max: "",
      benefits: "",
      publish: verified,
    },
  });
  const modality = form.watch("modality");

  const submit = (publish: boolean) =>
    form.handleSubmit((v) =>
      start(async () => {
        const r = await createJob({ ...v, publish });
        if (!r.ok) return void toast.error(r.error);
        toast.success(publish ? "Vaga publicada no mural." : "Rascunho salvo.");
        router.push("/contratante");
      }),
    );

  return (
    <Form {...form}>
      <form onSubmit={submit(verified)} noValidate className="flex flex-col gap-5">
        {!verified && (
          <Alert variant="accent">
            <p>Enquanto a verificação não termina, a vaga fica como rascunho. Você publica com um toque depois.</p>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da vaga</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Auxiliar de cozinha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Área</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha a área" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea rows={6} placeholder="O que a pessoa vai fazer, horário, requisitos…" {...field} />
              </FormControl>
              <FormDescription>Não peça foto, idade, religião ou posição política. Isso viola o Compromisso.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="modality"
          render={({ field }) => (
            <FormItem>
              <FormLabel id="mod-l">Modalidade</FormLabel>
              <ChipGroup
                single
                options={Object.keys(MODALITIES) as Modality[]}
                value={[field.value]}
                onChange={(v) => field.onChange(v[0])}
                labelFor={(k) => MODALITIES[k]}
                ariaLabelledBy="mod-l"
              />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contract_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel id="ct-l">Contrato</FormLabel>
              <ChipGroup
                single
                options={Object.keys(CONTRACT_TYPES) as ContractType[]}
                value={[field.value]}
                onChange={(v) => field.onChange(v[0])}
                labelFor={(k) => CONTRACT_TYPES[k]}
                ariaLabelledBy="ct-l"
              />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade {modality === "remoto" && <span className="font-semibold normal-case">(opcional)</span>}</FormLabel>
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
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="salary_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salário de (R$)</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="1900" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salary_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Até (R$)</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Benefícios <span className="font-semibold normal-case">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex.: VT, refeição no local, plano de saúde" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-3 pr-1.5 pt-2 sm:flex-row-reverse">
          {verified && (
            <Button type="submit" size="lg" className="flex-[2]" disabled={pending}>
              {pending ? "Publicando…" : "Publicar vaga"}
            </Button>
          )}
          <Button type="button" variant="outline" size="lg" className="flex-1" disabled={pending} onClick={submit(false)}>
            Salvar rascunho
          </Button>
        </div>
      </form>
    </Form>
  );
}
