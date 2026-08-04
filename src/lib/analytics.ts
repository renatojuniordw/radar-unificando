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
  companies?: string[];
  roles?: string[];
}) {
  trackEvent("search_jobs", {
    search_term: params.searchTerm || "",
    total_empresas: params.companies?.length || 0,
    empresas: params.companies?.slice(0, 5).join(",") || "",
    cargos: params.roles?.slice(0, 5).join(",") || "",
  });
}

/**
 * Evento: Clique no link de aplicação da vaga (Gupy / InHire)
 */
export function trackJobApply(params: {
  title: string;
  company: string;
  platform: string;
  link: string;
}) {
  trackEvent("apply_job_click", {
    job_title: params.title,
    company: params.company,
    platform: params.platform,
    link_domain: params.link.includes("gupy") ? "gupy" : "inhire",
  });
}

/**
 * Evento: Exportação da lista de vagas em CSV
 */
export function trackExportCsv(totalJobs: number) {
  trackEvent("export_csv", {
    total_vagas: totalJobs,
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
