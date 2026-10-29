import { SectionTitle } from "@/components/layout/app-shell";
import { DeleteAccountDialog } from "@/components/privacy/delete-account-dialog";
import type { Role } from "@/lib/types";

/** Acesso direto à exclusão da conta, no fim do painel de cada tipo de perfil (menos admin). */
export function AccountDangerZone({ role }: { role: Role }) {
  if (role === "admin") return null;
  return (
    <section aria-labelledby="conta-t" className="mt-4 flex flex-col gap-3">
      <SectionTitle>Sua conta</SectionTitle>
      <p className="text-sm font-medium">Você pode baixar seus dados ou excluir a conta quando quiser, em Privacidade e dados.</p>
      <DeleteAccountDialog role={role} />
    </section>
  );
}
