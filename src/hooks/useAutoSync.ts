"use client";

import { useEffect, useRef } from "react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";

const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos

export interface AutoSyncOptions {
  /** Cooldown atual em segundos. Auto-sync não dispara se > 0. */
  cooldown: number;
  /** Se uma busca manual está em andamento. */
  running: boolean;
  /** Se um auto-sync está em andamento. */
  autoSyncing: boolean;
  /** Se o cooldown foi carregado do storage. */
  cooldownLoaded: boolean;
  /** Se os filtros foram carregados do storage. */
  filtersLoaded: boolean;
  /** Lista de empresas selecionadas. */
  companies: string[];
  /** Lista de queries de cargo. */
  roleQueries: string[];
  /** Callback para iniciar busca silenciosa. */
  onAutoSync: () => void;
  /** Ref que bloqueia auto-sync (ex.: busca via URL em andamento). */
  blockedRef: React.RefObject<boolean>;
}

/**
 * Hook responsável por decidir e disparar o auto-sync do pipeline.
 * Extraído de useJobSearch para separar responsabilidades (SRP).
 *
 * Regras:
 * - Só dispara após cooldown e filtros serem carregados do storage
 * - Pula quando há busca em andamento ou cooldown ativo
 * - Pula quando não há filtros salvos (evita "vagas aleatórias")
 * - Intervalo mínimo de 15 minutos entre execuções
 * - Protege contra loops de auto-sync na mesma aba (lastAutoSyncAttemptRef)
 */
export function useAutoSync(options: AutoSyncOptions) {
  const {
    cooldown,
    running,
    autoSyncing,
    cooldownLoaded,
    filtersLoaded,
    companies,
    roleQueries,
    onAutoSync,
    blockedRef,
  } = options;

  // Referência estável para o callback (evita re-render do effect)
  const onAutoSyncRef = useRef(onAutoSync);
  useEffect(() => {
    onAutoSyncRef.current = onAutoSync;
  });

  // Protege contra loops: registra timestamp da última tentativa de auto-sync
  const lastAutoSyncAttemptRef = useRef(0);

  useEffect(() => {
    // Só decide após cooldown e filtros serem carregados do storage
    if (blockedRef.current) return;
    if (
      !cooldownLoaded ||
      !filtersLoaded ||
      cooldown > 0 ||
      running ||
      autoSyncing
    )
      return;
    if (companies.length === 0 && roleQueries.length === 0) return;

    let cancelled = false;
    browserStorage.getLastRunAt().then((ts) => {
      if (cancelled) return;
      const now = Date.now();
      const sinceLastRun = ts ? now - ts : Infinity;
      if (
        sinceLastRun > AUTO_SYNC_INTERVAL_MS &&
        now - lastAutoSyncAttemptRef.current > AUTO_SYNC_INTERVAL_MS
      ) {
        lastAutoSyncAttemptRef.current = now;
        onAutoSyncRef.current();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cooldown, running, autoSyncing, cooldownLoaded, filtersLoaded, companies, roleQueries, blockedRef]);
}
