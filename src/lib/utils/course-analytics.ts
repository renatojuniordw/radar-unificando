"use client";

import { trackEvent } from "@/lib/utils/analytics";

export interface CourseClickParams {
  courseId: string;
  skill?: string;
  platform?: string;
  origin: "web" | "chat" | "sidebar" | "cursos" | "extension";
  url: string;
}

/**
 * Registra um clique em link de curso de afiliado:
 * 1. Evento no Google Analytics 4 (quando disponível).
 * 2. Beacon para o backend (registro próprio — funciona mesmo sem GA).
 * Fire-and-forget: nunca deve bloquear a navegação.
 */
export function trackCourseClick(params: CourseClickParams) {
  trackEvent("course_click", {
    skill: params.skill || "",
    plataforma: params.platform || "",
    origem: params.origin,
  });

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const payload = new Blob([JSON.stringify(params)], { type: "application/json" });
      navigator.sendBeacon("/api/track/course-click", payload);
    }
  } catch (error) {
    console.debug("[course-click] Beacon falhou:", error);
  }
}
