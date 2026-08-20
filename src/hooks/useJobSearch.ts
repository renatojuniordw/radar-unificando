"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";
import { useProfile } from "@/hooks/useProfile";
import { uniqueValues } from "@/lib/utils/array";
import { trackJobSearch } from "@/lib/utils/analytics";
import { useCooldown } from "@/hooks/useCooldown";
import { useAutoSync } from "@/hooks/useAutoSync";
import { usePipelineStream } from "@/hooks/usePipelineStream";
import { useJobFiltersState } from "@/hooks/useJobFiltersState";
import type { Job } from "@/lib/types/job";

/**
 * Hook principal de busca de vagas.
 * Composta por hooks menores com responsabilidades isoladas:
 * - useJobFiltersState: filtros, persistência e sugestões
 * - useCooldown: contagem regressiva entre buscas
 * - useAutoSync: decide e dispara sincronização automática
 * - usePipelineStream: gerencia conexão SSE com o pipeline
 */
export function useJobSearch(initialJobs: Job[] = []) {
  const { data: session } = useSession();
  const profile = useProfile();
  const [running, setRunning] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [roleCategories, setRoleCategories] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: "success" | "error" | "info";
  } | null>(null);

  // Termo `q` da URL (ex: busca da home) — já aplicado ou não.
  const urlQueryHandledRef = useRef<string | null>(null);
  // Bloqueia o auto-sync enquanto uma busca vinda da URL estiver em andamento.
  const autoSyncBlockedRef = useRef(false);

  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q");

  // --- Hook de filtros extraído ---
  const {
    companies,
    setCompanies,
    roleQueries,
    setRoleQueries,
    clientFilter,
    setClientFilter,
    filtersLoaded,
    addSuggestion,
  } = useJobFiltersState(urlQuery);

  // --- Derivações de perfil (antes de loadJobs que depende delas) ---

  const minimalProfile = useMemo(() => {
    return (
      profile.skills.length >= 3 &&
      Boolean(profile.currentRole || profile.area)
    );
  }, [profile.skills.length, profile.currentRole, profile.area]);

  const recommendedMode = useMemo(
    () => !!(session && minimalProfile),
    [session, minimalProfile],
  );

  // --- Composição de hooks extraídos ---

  const { cooldown, loaded: cooldownLoaded, startCooldown } = useCooldown();

  const loadJobs = useCallback(
    async (filters?: {
      platform?: string;
      role?: string;
      search?: string;
    }) => {
      setLoading(true);
      const params = new URLSearchParams();

      if (recommendedMode && session) {
        params.set("recommended", "1");
      } else {
        if (filters?.platform) params.set("platform", filters.platform);
        if (filters?.role) params.set("role", filters.role);
        if (filters?.search) params.set("search", filters.search);
      }

      try {
        const query = params.toString();
        const res = await fetch(`/api/vagas${query ? "?" + query : ""}`);

        if (!res.ok) {
          if (res.status === 429) {
            setSnackbar({
              message: "Muitas buscas em pouco tempo. Aguarde alguns segundos.",
              severity: "error",
            });
          } else {
            setSnackbar({
              message: "Falha ao carregar vagas. Tente novamente.",
              severity: "error",
            });
          }
          return;
        }

        const data = await res.json();
        const loadedJobs = Array.isArray(data) ? data : [];
        setJobs(loadedJobs);

        if (!session && loadedJobs.length > 0)
          await browserStorage.setJobs(loadedJobs);

        const uniqueRoleCategories = uniqueValues(
          loadedJobs.map((j: Job) => j.roleCategory),
        ) as string[];
        setRoleCategories(uniqueRoleCategories);
      } catch {
        setSnackbar({
          message: "Erro de conexão ao carregar vagas.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [recommendedMode, session],
  );

  // Callbacks para usePipelineStream
  const onJobsReceived = useCallback(
    (completedJobs: Job[]) => {
      setJobs(completedJobs);
      const uniqueRoleCategories = uniqueValues(
        completedJobs.map((j: Job) => j.roleCategory),
      );
      setRoleCategories(uniqueRoleCategories);
    },
    [],
  );

  const onReloadNeeded = useCallback(() => {
    loadJobs().catch(() => {});
  }, [loadJobs]);

  const onPipelineFinished = useCallback(() => {
    setRunning(false);
    setAutoSyncing(false);
  }, []);

  const showSnackbar = useCallback(
    (message: string, severity: "success" | "error" | "info") => {
      setSnackbar({ message, severity });
    },
    [],
  );

  const { connectToPipeline } = usePipelineStream({
    onJobsReceived,
    onReloadNeeded,
    onPipelineFinished,
    showSnackbar,
  });

  const handleStart = useCallback(
    async (options?: {
      silent?: boolean;
      queries?: string[];
      companies?: string[];
    }) => {
      const isSilent = options?.silent ?? false;
      const effectiveQueries = options?.queries ?? roleQueries;
      const effectiveCompanies = options?.companies ?? companies;

      if (isSilent) {
        setAutoSyncing(true);
      } else {
        setRunning(true);
        setJobs([]);
        if (!session) await browserStorage.clear();
        trackJobSearch({
          companies: effectiveCompanies,
          roles: effectiveQueries,
        });
      }

      try {
        const res = await fetch("/api/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companies: effectiveCompanies,
            queries: effectiveQueries,
            auto: isSilent,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 429 && body.retryAfter) {
            if (!isSilent) {
              await startCooldown(body.retryAfter);
              showSnackbar(body.error || "Muitas requisições. Aguarde.", "info");
            }
            if (isSilent) {
              const now = Date.now();
              setLastRunAt(now);
              void browserStorage.setLastRunAt(now);
            }
          } else if (!isSilent) {
            showSnackbar(
              body.error || "Erro ao iniciar a busca de vagas",
              "error",
            );
          }
          setRunning(false);
          setAutoSyncing(false);
          return;
        }

        const { runId: id, cooldownSeconds: cd } = await res.json();
        if (cd && !isSilent) {
          await startCooldown(cd);
        }

        const now = Date.now();
        setLastRunAt(now);
        void browserStorage.setLastRunAt(now);

        connectToPipeline(id, { isSilent, session });
      } catch {
        if (!isSilent) {
          showSnackbar("Erro ao iniciar a busca de vagas", "error");
        }
        setRunning(false);
        setAutoSyncing(false);
      }
    },
    [
      companies,
      roleQueries,
      session,
      startCooldown,
      showSnackbar,
      connectToPipeline,
    ],
  );

  // Carregar vagas salvas na montagem
  useEffect(() => {
    if (session) {
      queueMicrotask(() => {
        void loadJobs();
      });
    } else {
      let cancelled = false;
      browserStorage
        .getJobs()
        .then((stored) => {
          if (!cancelled && stored.length > 0) setJobs(stored as Job[]);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [session, loadJobs]);

  // Carregar timestamp da última busca
  useEffect(() => {
    browserStorage
      .getLastRunAt()
      .then((ts) => {
        if (ts) setLastRunAt(ts);
      })
      .catch(() => {});
  }, []);

  // Auto-sync via useAutoSync
  useAutoSync({
    cooldown,
    running,
    autoSyncing,
    cooldownLoaded,
    filtersLoaded,
    companies,
    roleQueries,
    onAutoSync: () => handleStartRef.current({ silent: true }),
    blockedRef: autoSyncBlockedRef,
  });

  const handleStartRef = useRef(handleStart);
  useEffect(() => {
    handleStartRef.current = handleStart;
  });

  // Termo `q` vindo da URL
  useEffect(() => {
    if (!urlQuery) return;
    if (!filtersLoaded || !cooldownLoaded) return;
    if (urlQueryHandledRef.current === urlQuery) return;
    urlQueryHandledRef.current = urlQuery;

    autoSyncBlockedRef.current = true;

    const parsedQueries = urlQuery
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedQueries.length > 0) {
      queueMicrotask(() => {
        setRoleQueries(parsedQueries);
        if (cooldown > 0 || running || autoSyncing) return;
        void handleStart({ queries: parsedQueries });
      });
    }
  }, [
    urlQuery,
    filtersLoaded,
    cooldownLoaded,
    cooldown,
    running,
    autoSyncing,
    handleStart,
    setRoleQueries,
  ]);

  const filteredJobs = useMemo(() => {
    if (!clientFilter.trim()) return jobs;
    const term = clientFilter.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchTitle = j.title?.toLowerCase().includes(term);
      const matchCompany = j.company?.toLowerCase().includes(term);
      const matchLocation = j.location?.toLowerCase().includes(term);
      const matchCategory = j.roleCategory?.toLowerCase().includes(term);
      const matchPlatform = j.platform?.toLowerCase().includes(term);
      return (
        matchTitle ||
        matchCompany ||
        matchLocation ||
        matchCategory ||
        matchPlatform
      );
    });
  }, [jobs, clientFilter]);

  return {
    session,
    profile,
    companies,
    setCompanies,
    roleQueries,
    setRoleQueries,
    running,
    autoSyncing,
    lastRunAt,
    jobs,
    filteredJobs,
    clientFilter,
    setClientFilter,
    loading,
    roleCategories,
    snackbar,
    setSnackbar,
    cooldown,
    recommendedMode,
    minimalProfile,
    loadJobs,
    addSuggestion,
    handleStart,
  };
}
