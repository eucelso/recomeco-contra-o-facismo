"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Building, KeyRound, Lock, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { emailSchema, loginSchema, signupSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";
type AccountType = "candidate" | "employer";
type FormValues = { email: string; password: string };

// O link por e-mail só funciona com SMTP próprio (domínio verificado). Ligue com NEXT_PUBLIC_MAGIC_LINK=true.
const MAGIC_LINK = process.env.NEXT_PUBLIC_MAGIC_LINK === "true";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}

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
  const [useLink, setUseLink] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
  const schema = useLink ? emailSchema : mode === "signup" ? signupSchema : loginSchema;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { email: "", password: "" },
  });

  const redirectUrl = (path: string) => {
    const url = new URL(path, window.location.origin);
    if (mode === "signup") url.searchParams.set("tipo", type);
    if (next) url.searchParams.set("next", next);
    return url.toString();
  };

  async function sendLink(email: string) {
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

  async function onSubmit({ email, password }: FormValues) {
    if (useLink) return sendLink(email);

    const supabase = createClient();
    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        if (err.status === 429) toast.error("Muitas tentativas. Espere um minuto e tente de novo.");
        else form.setError("password", { message: "E-mail ou senha incorretos." });
        return;
      }
      window.location.assign(redirectUrl("/auth/continuar"));
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl("/auth/confirm"), data: { account_type: type } },
    });
    if (err) {
      if (/already|registered/i.test(err.message)) {
        form.setError("email", { message: "Esse e-mail já tem conta. Use a aba Entrar." });
      } else if (/password/i.test(err.message)) {
        form.setError("password", { message: "Senha fraca demais. Use maiúscula, minúscula, número e símbolo." });
      } else if (err.status === 429) {
        toast.error("Muitas tentativas. Espere um minuto e tente de novo.");
      } else {
        toast.error("Não conseguimos criar a conta agora. Tente de novo em instantes.");
      }
      return;
    }
    // Com a confirmação de e-mail desligada o Supabase já devolve a sessão; ligada, a pessoa precisa confirmar.
    if (data.session) {
      window.location.assign(redirectUrl("/auth/continuar"));
      return;
    }
    setSentTo(email);
  }

  async function signInWithProvider(provider: "google" | "facebook") {
    setOauthLoading(provider);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl("/auth/callback") },
    });
    if (err) {
      setOauthLoading(null);
      toast.error(`Não foi possível abrir o login do ${provider === "google" ? "Google" : "Facebook"}.`);
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
        <p className="text-base font-medium leading-relaxed">Entre com e-mail e senha, ou continue com o Google ou o Facebook.</p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList aria-label="Acesso">
          <TabsTrigger value="login">Entrar</TabsTrigger>
          <TabsTrigger value="signup">Criar conta</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "login" && (
        <p className="-mt-2 border-l-[5px] border-accent pl-3 text-sm font-semibold leading-relaxed">
          Candidatos e empresas entram pelo mesmo lugar: use o e-mail e a senha da sua conta. Ainda não tem conta de empresa?{" "}
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setType("employer");
            }}
            className="font-extrabold underline"
          >
            Cadastrar empresa
          </button>
        </p>
      )}

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
          <Button variant="outline" size="lg" onClick={() => signInWithProvider("google")} disabled={oauthLoading !== null} className="bg-white text-[#141210]">
            <GoogleIcon />
            Continuar com Google
          </Button>
          <Button variant="outline" size="lg" onClick={() => signInWithProvider("facebook")} disabled={oauthLoading !== null} className="bg-white text-[#141210]">
            <FacebookIcon />
            Continuar com Facebook
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
              {!useLink && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          placeholder={mode === "signup" ? "Ex.: Recomeco#2026" : "Sua senha"}
                          {...field}
                        />
                      </FormControl>
                      {mode === "signup" && (
                        <p className="text-sm font-medium">Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {useLink ? <Mail strokeWidth={2.6} aria-hidden="true" /> : <KeyRound strokeWidth={2.6} aria-hidden="true" />}
                {form.formState.isSubmitting ? "Enviando…" : useLink ? "Enviar link de acesso" : mode === "signup" ? "Criar conta" : "Entrar"}
              </Button>
              {MAGIC_LINK && (
                <Button type="button" variant="ghost" onClick={() => setUseLink((v) => !v)} className="self-start px-0">
                  {useLink ? "Prefiro usar senha" : "Prefiro receber um link por e-mail"}
                </Button>
              )}
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
