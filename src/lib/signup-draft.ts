// Rascunho do último passo do cadastro, guardado só nesta aba (sessionStorage): some ao fechar a aba.
// Serve para quem sai para ler outra página e volta sem perder o que já escreveu.
export type Step4Draft = {
  report: string;
  report_consent: boolean;
  anonymous: boolean;
  resumePath: string | null;
  file: { name: string; size: number } | null;
};

const draftKey = (userId: string) => `recomeco-cadastro-passo4:${userId}`;
export const RETURN_KEY = "recomeco-voltar-cadastro";

export function readStep4Draft(userId: string): Step4Draft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(userId));
    return raw ? (JSON.parse(raw) as Step4Draft) : null;
  } catch {
    return null;
  }
}

export function writeStep4Draft(userId: string, draft: Step4Draft) {
  try {
    sessionStorage.setItem(draftKey(userId), JSON.stringify(draft));
  } catch {
    /* navegação privada ou armazenamento cheio: segue sem rascunho */
  }
}

export function clearStep4Draft(userId: string) {
  try {
    sessionStorage.removeItem(draftKey(userId));
  } catch {}
}

/** Marca de onde a pessoa saiu, para a página de destino oferecer o botão de voltar. */
export function rememberReturn(path: string) {
  try {
    sessionStorage.setItem(RETURN_KEY, path);
  } catch {}
}
