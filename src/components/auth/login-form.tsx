"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import Link from "next/link";
import { Building, Lock, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { emailSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";
type AccountType = "candidate" | "employer";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

export function LoginForm({
  initialMode,
  initialType,
  next,
  error,
}: {
  initialMode: Mode;
  initialType: AccountType;
  next: string | null;
  error: string | null;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [type, setType] = useState<AccountType>(initialType);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const form = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });

  const redirectUrl = (path: string) => {
    const url = new URL(path, window.location.origin);
    if (mode === "signup") url.searchParams.set("tipo", type);
    if (next) url.searchParams.set("next", next);
    return url.toString();
  };

  async function onSubmit({ email }: z.infer<typeof emailSchema>) {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "signup",
        emailRedirectTo: redirectUrl("/auth/confirm"),
        data: mode === "signup" ? { account_type: type } : undefined,
      },
    });
    if (err) {
      if (mode === "login" && /signup|not allowed|not found/i.test(err.message)) {
        form.setError("email", { message: "Não achamos uma conta com esse e-mail. Quer criar uma?" });
      } else if (err.status === 429) {
        toast.error("Muitas tentativas. Espere um minuto e tente de novo.");
      } else {
        toast.error("Não conseguimos enviar o link agora. Tente de novo em instantes.");
      }
      return;
    }
    setSentTo(email);
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl("/auth/callback") },
    });
    if (err) {
      setGoogleLoading(false);
      toast.error("Não foi possível abrir o login do Google.");
    }
  }

  const typeCard = (value: AccountType, title: string, hint: string, Icon: typeof Search, iconBox: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={type === value}
      onClick={() => setType(value)}
      className={cn(
        "flex w-full items-center gap-3.5 border-3 border-foreground bg-card p-3.5 text-left",
        type === value ? "shadow-hard-primary" : "shadow-hard",
      )}
    >
      <span className={cn("flex size-[46px] shrink-0 items-center justify-center border-3 border-foreground", iconBox)}>
        <Icon className="size-[22px]" strokeWidth={2.8} aria-hidden="true" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <strong className="text-base font-black uppercase">{title}</strong>
        <span className="text-sm font-medium">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "size-6 shrink-0 rounded-full border-3 border-foreground",
          type === value ? "bg-primary shadow-[inset_0_0_0_3px_hsl(var(--card))]" : "bg-card",
        )}
      />
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-[46px] uppercase leading-[0.98]">
          Que bom ter você <span className="text-primary">aqui.</span>
        </h1>
        <p className="text-base font-medium leading-relaxed">Sem senha para decorar: a gente manda um link seguro para o seu e-mail.</p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList aria-label="Acesso">
          <TabsTrigger value="login">Entrar</TabsTrigger>
          <TabsTrigger value="signup">Criar conta</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "signup" && (
        <div role="radiogroup" aria-labelledby="tipo-label" className="flex flex-col gap-3 pr-1.5">
          <p id="tipo-label" className="text-sm font-black uppercase tracking-wide">
            Como você quer usar?
          </p>
          {typeCard("candidate", "Procuro trabalho", "Grátis. Anônimo até você aceitar.", Search, "bg-primary text-primary-foreground")}
          {typeCard("employer", "Quero contratar", "Empresa, cooperativa ou autônomo.", Building, "bg-secondary text-accent")}
        </div>
      )}

      {sentTo ? (
        <div role="status" className="mr-1.5 flex flex-col gap-3 border-3 border-foreground bg-accent p-5 text-accent-foreground shadow-hard">
          <strong className="font-display text-3xl uppercase leading-none">Confira seu e-mail</strong>
          <p className="text-[15px] font-semibold leading-relaxed">
            Enviamos um link para <strong>{sentTo}</strong>. Ele vale por 1 hora. Não chegou? Olhe a caixa de spam.
          </p>
          <Button variant="ghost" onClick={() => setSentTo(null)} className="self-start px-0">
            Usar outro e-mail
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pr-1.5">
          <Button variant="outline" size="lg" onClick={signInWithGoogle} disabled={googleLoading} className="bg-white text-[#141210]">
            <GoogleIcon />
            Continuar com Google
          </Button>
          <div className="flex items-center gap-3 text-[13px] font-black uppercase">
            <span className="h-[3px] flex-1 bg-foreground" />
            ou por e-mail
            <span className="h-[3px] flex-1 bg-foreground" />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" inputMode="email" autoComplete="email" placeholder="seunome@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <Mail strokeWidth={2.6} aria-hidden="true" />
                {form.formState.isSubmitting ? "Enviando…" : "Enviar link de acesso"}
              </Button>
            </form>
          </Form>
        </div>
      )}

      <Alert variant="ink">
        <Lock aria-hidden="true" />
        <p>
          Nunca pedimos seu voto e ele nunca aparece no seu perfil. Ao continuar, você concorda com a{" "}
          <Link href="/politica-de-privacidade" className="font-extrabold text-accent underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </Alert>
    </div>
  );
}
