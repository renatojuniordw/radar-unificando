import { sendGAEvent } from "@next/third-parties/google";

/**
 * Utilitário seguro para envio de eventos personalizados ao Google Analytics 4.
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) {
  try {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_GA_ID) {
      sendGAEvent("event", eventName, eventParams || {});
    }
  } catch (error) {
    // Evita interromper a execução do app caso o GA esteja bloqueado por adblocker
    console.debug("[Analytics Event Error]", error);
  }
}

/**
 * Evento: Busca por vagas realizada pelo usuário
 */
export function trackJobSearch(params: {
  searchTerm?: string;
  empresas?: string[];
  cargos?: string[];
}) {
  trackEvent("search_jobs", {
    search_term: params.searchTerm || "",
    total_empresas: params.empresas?.length || 0,
    empresas: params.empresas?.slice(0, 5).join(",") || "",
    cargos: params.cargos?.slice(0, 5).join(",") || "",
  });
}

/**
 * Evento: Clique no link de aplicação da vaga (Gupy / InHire)
 */
export function trackJobApply(params: {
  titulo: string;
  empresa: string;
  plataforma: string;
  link: string;
}) {
  trackEvent("apply_job_click", {
    job_title: params.titulo,
    company: params.empresa,
    platform: params.plataforma,
    link_domain: params.link.includes("gupy") ? "gupy" : "inhire",
  });
}

/**
 * Evento: Exportação da lista de vagas em CSV
 */
export function trackExportCsv(totalVagas: number) {
  trackEvent("export_csv", {
    total_vagas: totalVagas,
  });
}

/**
 * Evento: Interação com o Assistente de IA
 */
export function trackAiChat(action: "send_message" | "open_chat" | "clear_history") {
  trackEvent("ai_assistant_action", {
    action,
  });
}
