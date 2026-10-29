"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowRight, ChevronLeft, EyeOff, FileText, Lock, Plus, Trash, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { saveStep1, saveStep2, saveStep3, finishOnboarding } from "@/app/cadastro/candidato/actions";
import { ChipGroup } from "@/components/forms/chip-group";
import { StepProgress } from "@/components/forms/step-progress";
import { TagInput } from "@/components/forms/tag-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AREAS, AVAILABILITY, CONTRACT_TYPES, EDUCATION, MODALITIES, SHIFTS, STATES, type ContractType, type Modality } from "@/lib/constants";
import { clearStep4Draft, readStep4Draft, rememberReturn, writeStep4Draft } from "@/lib/signup-draft";
import { createClient } from "@/lib/supabase/client";
import { candidateStep1, candidateStep2, candidateStep3, candidateStep4 } from "@/lib/validation";

export type CandidateDraft = {
  step: number;
  userId: string;
  full_name: string;
  preferred_name: string;
  city: string;
  state?: (typeof STATES)[number];
  areas: (typeof AREAS)[number][];
  headline: string;
  years_experience: string;
  skills: string[];
  education?: (typeof EDUCATION)[number];
  courses: string;
  experiences: z.input<typeof candidateStep2>["experiences"];
  available_from?: (typeof AVAILABILITY)[number];
  shifts: (typeof SHIFTS)[number][];
  modalities: Modality[];
  contract_types: ContractType[];
  resume_path: string | null;
  report: string;
  anonymous: boolean;
  completed: boolean;
};

const LABELS = ["Você", "Trabalho", "Horários", "Currículo"];

export function CandidateWizard({ draft }: { draft: CandidateDraft }) {
  const [step, setStep] = useState(draft.step);
  const [data, setData] = useState(draft);
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex flex-col gap-3 border-b-3 border-foreground px-2 pb-4 pt-2">
        <div className="flex h-12 items-center justify-between">
          {step > 1 ? (
            <button type="button" onClick={() => go(step - 1)} aria-label="Etapa anterior" className="flex size-11 items-center justify-center">
              <ChevronLeft className="size-7" strokeWidth={3} />
            </button>
          ) : (
            <Link href="/" aria-label="Sair do cadastro" className="flex size-11 items-center justify-center">
              <X className="size-6" strokeWidth={3} />
            </Link>
          )}
          <span className="text-[13px] font-black uppercase tracking-wider">
            Etapa {step} de {LABELS.length}
          </span>
          <Link href={draft.completed ? "/painel" : "/"} className="flex h-11 items-center px-2 text-sm font-extrabold underline">
            Sair
          </Link>
        </div>
        <div className="px-2">
          <StepProgress step={step} labels={LABELS} />
        </div>
      </header>

      <main id="conteudo" className="flex flex-col gap-6 px-4 pb-12 pt-6">
        {step === 1 && <Step1 data={data} onDone={(v) => (setData({ ...data, ...v }), go(2))} />}
        {step === 2 && <Step2 data={data} onDone={(v) => (setData({ ...data, ...v }), go(3))} onBack={() => go(1)} />}
        {step === 3 && <Step3 data={data} onDone={(v) => (setData({ ...data, ...v }), go(4))} onBack={() => go(2)} />}
        {step === 4 && <Step4 data={data} onBack={() => go(3)} />}
      </main>
    </div>
  );
}

function StepHeader({ title, text }: { title: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-[42px] uppercase leading-[0.98]">{title}</h1>
      <p className="text-base font-medium leading-relaxed">{text}</p>
    </div>
  );
}

function NavButtons({ onBack, pending, label = "Continuar" }: { onBack?: () => void; pending: boolean; label?: string }) {
  return (
    <div className="flex gap-3 pr-1.5 pt-2">
      {onBack && (
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          Voltar
        </Button>
      )}
      <Button type="submit" size="lg" className="flex-[2]" disabled={pending}>
        {pending ? "Salvando…" : label}
        {!pending && <ArrowRight strokeWidth={3} aria-hidden="true" />}
      </Button>
    </div>
  );
}

function ErrorSummary({ count }: { count: number }) {
  if (!count) return null;
  return (
    <p role="status" className="text-center text-[13px] font-semibold">
      {count === 1 ? "1 campo precisa" : `${count} campos precisam`} de atenção antes de continuar.
    </p>
  );
}

/* ------------------------------------------------------------------ */

function Step1({ data, onDone }: { data: CandidateDraft; onDone: (v: Partial<CandidateDraft>) => void }) {
  const [pending, start] = useTransition();
  const form = useForm<z.input<typeof candidateStep1>, unknown, z.output<typeof candidateStep1>>({
    resolver: zodResolver(candidateStep1),
    defaultValues: {
      full_name: data.full_name,
      preferred_name: data.preferred_name,
      city: data.city,
      state: data.state,
      areas: data.areas,
    },
  });
  const submit = form.handleSubmit((v) =>
    start(async () => {
      const r = await saveStep1(v);
      if (!r.ok) return void toast.error(r.error);
      onDone(v as Partial<CandidateDraft>);
    }),
  );

  return (
    <>
      <StepHeader title="Vamos começar por você" text="Respira. São só 4 etapas curtas, e você pode parar e voltar quando quiser." />
      <Alert variant="ink">
        <Lock aria-hidden="true" />
        <p>
          <strong className="text-accent">Nunca perguntamos seu voto.</strong> Seu nome só aparece para uma empresa depois que
          você aceitar o contato.
        </p>
      </Alert>
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
          <FormField
            control={form.control}
            name="preferred_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Como prefere ser chamada(o)? <span className="font-semibold normal-case">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: Carla" {...field} />
                </FormControl>
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
                    <Input autoComplete="address-level2" placeholder="Digite sua cidade" {...field} />
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
            name="areas"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel id="areas-label">Área de atuação · escolha até 3</FormLabel>
                <ChipGroup options={AREAS} value={field.value ?? []} onChange={field.onChange} max={3} invalid={!!fieldState.error} ariaLabelledBy="areas-label" />
                <FormMessage />
              </FormItem>
            )}
          />
          <NavButtons pending={pending} />
          <ErrorSummary count={Object.keys(form.formState.errors).length} />
        </form>
      </Form>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Step2({ data, onDone, onBack }: { data: CandidateDraft; onDone: (v: Partial<CandidateDraft>) => void; onBack: () => void }) {
  const [pending, start] = useTransition();
  const form = useForm<z.input<typeof candidateStep2>, unknown, z.output<typeof candidateStep2>>({
    resolver: zodResolver(candidateStep2),
    defaultValues: {
      headline: data.headline,
      years_experience: data.years_experience,
      skills: data.skills,
      experiences: data.experiences.length ? data.experiences : [{ role_title: "", employer_kind: "", employer_name: "", start_year: "", end_year: "", description: "" }],
      education: data.education,
      courses: data.courses,
    },
  });
  const exps = useFieldArray({ control: form.control, name: "experiences" });
  const submit = form.handleSubmit((v) =>
    start(async () => {
      const cleaned = { ...v, experiences: v.experiences.filter((x) => x.role_title.trim()) };
      const r = await saveStep2(cleaned);
      if (!r.ok) return void toast.error(r.error);
      onDone(cleaned as Partial<CandidateDraft>);
    }),
  );

  return (
    <>
      <StepHeader title="O que você sabe fazer" text="Isso é o que as empresas vão ver primeiro. Sem nome, sem foto: só o seu trabalho." />
      <Form {...form}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua profissão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Cozinheira" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="years_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anos</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="Ex.: 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="skills-input">Habilidades</FormLabel>
                <TagInput id="skills-input" value={field.value ?? []} onChange={field.onChange} placeholder="Ex.: Atendimento, Excel, Solda" />
                <FormDescription>Aperte o + ou Enter para adicionar.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 text-sm font-black uppercase">Experiências</legend>
            {exps.fields.map((f, i) => (
              <div key={f.id} className="mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-card p-4 shadow-hard-sm">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-primary">{String(i + 1).padStart(2, "0")}</span>
                  {exps.fields.length > 1 && (
                    <button type="button" onClick={() => exps.remove(i)} aria-label={`Remover experiência ${i + 1}`} className="flex size-11 items-center justify-center">
                      <Trash className="size-5" strokeWidth={2.6} />
                    </button>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name={`experiences.${i}.role_title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Chefe de cozinha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`experiences.${i}.employer_kind`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de lugar</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Restaurante de médio porte" {...field} />
                      </FormControl>
                      <FormDescription>É isso que aparece no perfil anônimo.</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`experiences.${i}.employer_name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nome da empresa <span className="font-semibold normal-case">(opcional, oculto até o aceite)</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`experiences.${i}.start_year`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" placeholder="2019" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`experiences.${i}.end_year`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" placeholder="Atual" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`experiences.${i}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        O que você fazia <span className="font-semibold normal-case">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} className="min-h-[90px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            {exps.fields.length < 10 && (
              <Button
                type="button"
                variant="outline"
                className="mr-1.5 border-dashed shadow-none"
                onClick={() => exps.append({ role_title: "", employer_kind: "", employer_name: "", start_year: "", end_year: "", description: "" })}
              >
                <Plus strokeWidth={3} aria-hidden="true" /> Adicionar experiência
              </Button>
            )}
          </fieldset>

          <FormField
            control={form.control}
            name="education"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escolaridade</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EDUCATION.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="courses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cursos <span className="font-semibold normal-case">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: Gastronomia (SENAC)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <NavButtons onBack={onBack} pending={pending} />
          <ErrorSummary count={Object.keys(form.formState.errors).length} />
        </form>
      </Form>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Step3({ data, onDone, onBack }: { data: CandidateDraft; onDone: (v: Partial<CandidateDraft>) => void; onBack: () => void }) {
  const [pending, start] = useTransition();
  const form = useForm<z.input<typeof candidateStep3>, unknown, z.output<typeof candidateStep3>>({
    resolver: zodResolver(candidateStep3),
    defaultValues: {
      available_from: data.available_from,
      shifts: data.shifts,
      modalities: data.modalities,
      contract_types: data.contract_types,
    },
  });
  const submit = form.handleSubmit((v) =>
    start(async () => {
      const r = await saveStep3(v);
      if (!r.ok) return void toast.error(r.error);
      onDone(v as Partial<CandidateDraft>);
    }),
  );
  const modalityKeys = Object.keys(MODALITIES) as Modality[];
  const contractKeys = Object.keys(CONTRACT_TYPES) as ContractType[];

  return (
    <>
      <StepHeader title="Quando e como você pode trabalhar" text="Assim mostramos só as vagas que fazem sentido para você." />
      <Form {...form}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="available_from"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel id="avail-label">Pode começar</FormLabel>
                <ChipGroup
                  single
                  options={AVAILABILITY}
                  value={field.value ? [field.value] : []}
                  onChange={(v) => field.onChange(v[0])}
                  invalid={!!fieldState.error}
                  ariaLabelledBy="avail-label"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shifts"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel id="shifts-label">Turnos</FormLabel>
                <ChipGroup options={SHIFTS} value={field.value ?? []} onChange={field.onChange} invalid={!!fieldState.error} ariaLabelledBy="shifts-label" />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modalities"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel id="mod-label">Modalidade</FormLabel>
                <ChipGroup
                  options={modalityKeys}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  labelFor={(k) => MODALITIES[k]}
                  invalid={!!fieldState.error}
                  ariaLabelledBy="mod-label"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contract_types"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel id="ct-label">Tipo de contrato</FormLabel>
                <ChipGroup
                  options={contractKeys}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  labelFor={(k) => CONTRACT_TYPES[k]}
                  invalid={!!fieldState.error}
                  ariaLabelledBy="ct-label"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <NavButtons onBack={onBack} pending={pending} />
          <ErrorSummary count={Object.keys(form.formState.errors).length} />
        </form>
      </Form>
    </>
  );
}

/* ------------------------------------------------------------------ */

const MAX_PDF = 5 * 1024 * 1024;

function Step4({ data, onBack }: { data: CandidateDraft; onBack: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [resumePath, setResumePath] = useState<string | null>(data.resume_path);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(
    data.resume_path ? { name: "curriculo.pdf", size: 0 } : null,
  );
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<z.input<typeof candidateStep4>, unknown, z.output<typeof candidateStep4>>({
    resolver: zodResolver(candidateStep4),
    defaultValues: { report: data.report, report_consent: Boolean(data.report), anonymous: data.anonymous },
  });
  const reportLen = (form.watch("report") ?? "").length;

  // Quem sai para ler "Seus direitos" e volta não perde o relato nem o arquivo já enviado (rascunho só nesta aba).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const d = readStep4Draft(data.userId);
    if (d) {
      form.setValue("report", d.report);
      form.setValue("report_consent", d.report_consent);
      form.setValue("anonymous", d.anonymous);
      if (d.resumePath) {
        setResumePath(d.resumePath);
        setFileInfo(d.file);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const save = () => {
      const v = form.getValues();
      writeStep4Draft(data.userId, {
        report: v.report ?? "",
        report_consent: Boolean(v.report_consent),
        anonymous: v.anonymous !== false,
        resumePath,
        file: fileInfo,
      });
    };
    save();
    const sub = form.watch(save);
    return () => sub.unsubscribe();
  }, [hydrated, resumePath, fileInfo, form, data.userId]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    if (file.type !== "application/pdf") return setFileError("O arquivo precisa ser PDF.");
    if (file.size > MAX_PDF) return setFileError("O arquivo passou de 5 MB. Tente um PDF menor.");
    setUploading(true);
    const supabase = createClient();
    const path = `${data.userId}/curriculo.pdf`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true, contentType: "application/pdf" });
    setUploading(false);
    if (error) return setFileError("Não conseguimos enviar o arquivo. Tente de novo.");
    setResumePath(path);
    setFileInfo({ name: file.name, size: file.size });
  }

  async function removeFile() {
    if (!resumePath) return;
    const supabase = createClient();
    await supabase.storage.from("resumes").remove([resumePath]);
    setResumePath(null);
    setFileInfo(null);
  }

  const submit = form.handleSubmit((v) =>
    start(async () => {
      const r = await finishOnboarding(v, resumePath);
      if (!r.ok) return void toast.error(r.error);
      clearStep4Draft(data.userId);
      toast.success("Cadastro concluído. Bem-vinda(o)! Veja as vagas que combinam com você.");
      router.push("/combina");
      router.refresh();
    }),
  );

  return (
    <>
      <StepHeader title="Currículo e, se quiser, seu relato" text="As duas coisas são opcionais. Você pode terminar agora e completar depois." />
      <Form {...form}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-7">
          <section aria-labelledby="cv-title" className="flex flex-col gap-3">
            <h2 id="cv-title" className="text-[15px] font-black uppercase">
              Currículo em PDF <span className="font-semibold normal-case">(opcional)</span>
            </h2>
            <label
              htmlFor="cv-file"
              className="flex cursor-pointer flex-col items-center gap-2.5 border-3 border-dashed border-foreground bg-card px-4 py-6 text-center focus-within:outline focus-within:outline-[3px] focus-within:outline-ring"
            >
              <span className="flex size-[52px] items-center justify-center border-3 border-foreground bg-accent">
                <Upload className="size-6" strokeWidth={2.8} aria-hidden="true" />
              </span>
              <strong className="text-base font-black uppercase">{uploading ? "Enviando…" : "Escolher arquivo"}</strong>
              <span className="text-sm font-medium">Só PDF, até 5 MB. Dá para tirar foto do papel e salvar como PDF.</span>
              <input id="cv-file" type="file" accept="application/pdf" className="sr-only" onChange={onFile} disabled={uploading} />
            </label>
            {fileError && (
              <p role="alert" className="text-[13px] font-extrabold text-destructive">
                {fileError}
              </p>
            )}
            {fileInfo && (
              <div className="flex items-center gap-3 border-3 border-foreground bg-white p-3 text-[#141210]">
                <FileText className="size-8 shrink-0 text-primary" strokeWidth={2.4} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-extrabold">{fileInfo.name}</strong>
                  <span className="text-xs font-bold text-success">
                    Enviado{fileInfo.size ? ` · ${Math.round(fileInfo.size / 1024)} KB` : ""} · guardado em pasta privada
                  </span>
                </div>
                <button type="button" onClick={removeFile} aria-label="Remover currículo" className="flex size-11 items-center justify-center">
                  <X className="size-5" strokeWidth={3} />
                </button>
              </div>
            )}
          </section>

          <section
            aria-labelledby="relato-title"
            className="mr-1.5 flex flex-col gap-4 border-3 border-foreground bg-[#141210] p-4 text-[#F2E8D5] shadow-hard-primary sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-12 items-center justify-center border-3 border-[#F2E8D5] bg-[#E8A317] text-[#141210]">
                <Lock className="size-6" strokeWidth={2.8} aria-hidden="true" />
              </span>
              <span className="border-2 border-[#F2E8D5] bg-[#C8102E] px-2.5 py-1 text-xs font-black uppercase text-white">Só você vê</span>
            </div>
            <h2 id="relato-title" className="font-display text-3xl uppercase leading-none">
              Relato confidencial
            </h2>
            <p className="text-[15px] leading-relaxed text-[#E6DAC2]">
              Se quiser, conte o que aconteceu. Isso ajuda a organizar datas e provas.{" "}
              <strong className="text-[#F2E8D5]">Fica separado do seu perfil e nunca aparece para empresas.</strong>
            </p>
            <FormField
              control={form.control}
              name="report"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-[#E8A317]">O que aconteceu? (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      maxLength={3000}
                      placeholder="Ex.: Em 30/10, meu gerente disse no grupo da equipe que quem votasse no candidato X seria demitido…"
                      className="border-[#F2E8D5] bg-[#1F1C19] text-[#F2E8D5] placeholder:text-[#A89E90]"
                      {...field}
                    />
                  </FormControl>
                  <span className="self-end text-xs text-[#CBBFA8]" aria-live="polite">
                    {reportLen} / 3000
                  </span>
                  <FormMessage className="text-[#FF8A9A]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="report_consent"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5 border-[#F2E8D5]" />
                    </FormControl>
                    <FormLabel className="text-sm font-medium normal-case leading-relaxed text-[#F2E8D5]">
                      Autorizo guardar este relato só para meu uso. Posso apagá-lo a qualquer momento, e ele não é enviado a ninguém.
                    </FormLabel>
                  </div>
                  <FormMessage className="text-[#FF8A9A]" />
                </FormItem>
              )}
            />
            <Link href="/direitos" onClick={() => rememberReturn("/cadastro/candidato")} className="text-sm font-extrabold text-[#E8A317] underline">
              Ver como guardar provas e onde denunciar
            </Link>
          </section>

          <section aria-labelledby="priv-title" className="flex flex-col gap-3">
            <h2 id="priv-title" className="text-[15px] font-black uppercase">
              Sua privacidade
            </h2>
            <div className="border-3 border-foreground bg-card">
              <FormField
                control={form.control}
                name="anonymous"
                render={({ field }) => (
                  <FormItem className="flex-row items-center gap-3 border-b-2 border-foreground p-4">
                    <div className="flex-1">
                      <FormLabel className="text-[15px] normal-case">Perfil anônimo até eu aceitar</FormLabel>
                      <FormDescription>Empresas veem habilidades, nunca nome ou contato.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-3 p-4">
                <EyeOff className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2.8} aria-hidden="true" />
                <span className="text-sm font-semibold leading-relaxed">
                  Seu voto e sua opinião política nunca são pedidos nem exibidos. Isso não pode ser desligado.
                </span>
              </div>
            </div>
          </section>

          <NavButtons onBack={onBack} pending={pending || uploading} label="Concluir cadastro" />
        </form>
      </Form>
    </>
  );
}
