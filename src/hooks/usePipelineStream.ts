"use client";

import { useCallback, useRef } from "react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";
import type { Job } from "@/lib/types/job";

const WATCHDOG_MS = 180_000; // 3 minutos

export interface PipelineStreamCallbacks {
  /** Chamado quando o pipeline completa com jobs (anônimo: persiste no storage). */
  onJobsReceived: (jobs: Job[]) => void;
  /** Chamado quando o pipeline completa sem jobs inline (recarrega via API). */
  onReloadNeeded: () => void;
  /** Chamado quando o pipeline completa ou falha (sucesso ou erro). */
  onPipelineFinished: () => void;
  /** Exibe snackbar ao usuário. */
  showSnackbar: (
    message: string,
    severity: "success" | "error" | "info",
  ) => void;
}

/**
 * Hook responsável por gerenciar a conexão SSE com o pipeline de buscas.
 * Extraído de useJobSearch para separar responsabilidades (SRP).
 *
 * Funcionalidades:
 * - Cria EventSource e configura handlers (onmessage, onerror)
 * - Watchdog: fecha stream se nenhum evento terminal em 3 minutos
 * - Parseia eventos pipeline_complete / pipeline_error / pipeline_cancelled
 * - Persiste jobs no storage para usuários anônimos
 */
export function usePipelineStream(callbacks: PipelineStreamCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const connectToPipeline = useCallback(
    (
      runId: string,
      options: { isSilent: boolean; session: unknown },
    ) => {
      const { isSilent, session } = options;
      const { onJobsReceived, onReloadNeeded, onPipelineFinished, showSnackbar } =
        callbacksRef.current;

      const evtSource = new EventSource(
        `/api/pipeline/stream?runId=${runId}`,
      );

      // Watchdog: fecha stream se nenhum evento terminal em 3 minutos
      const watchdog = setTimeout(() => {
        evtSource.close();
        onPipelineFinished();
        if (!isSilent) {
          showSnackbar(
            "A busca demorou mais que o esperado. Tente novamente.",
            "error",
          );
        }
        onReloadNeeded();
      }, WATCHDOG_MS);

      evtSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type: string;
            message?: string;
            jobs?: Job[];
          };

          if (
            data.type === "pipeline_complete" ||
            data.type === "pipeline_error" ||
            data.type === "pipeline_cancelled"
          ) {
            clearTimeout(watchdog);
            evtSource.close();
            onPipelineFinished();

            if (
              !session &&
              data.type === "pipeline_complete" &&
              Array.isArray(data.jobs)
            ) {
              const completedJobs: Job[] = data.jobs.map((j) => ({
                ...j,
                detectedAt: j.detectedAt || "",
              }));
              onJobsReceived(completedJobs);
              await browserStorage.setJobs(data.jobs);
            } else {
              onReloadNeeded();
            }

            if (!isSilent) {
              showSnackbar(
                data.message || "Busca de vagas concluída!",
                data.type === "pipeline_complete" ? "success" : "error",
              );
            }
          }
        } catch {
          clearTimeout(watchdog);
          evtSource.close();
          onPipelineFinished();
          if (!isSilent) {
            showSnackbar(
              "Erro ao processar a busca. Tente novamente.",
              "error",
            );
          }
        }
      };

      evtSource.onerror = () => {
        clearTimeout(watchdog);
        evtSource.close();
        onPipelineFinished();
        if (!isSilent) {
          showSnackbar(
            "Falha na conexão com a busca. Tente novamente.",
            "error",
          );
        }
        onReloadNeeded();
      };
    },
    [],
  );

  return { connectToPipeline };
}
