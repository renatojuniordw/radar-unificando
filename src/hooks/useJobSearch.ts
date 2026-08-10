"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";
import { useProfile } from "@/hooks/useProfile";
import { uniqueValues } from "@/lib/utils/array";
import { trackJobSearch } from "@/lib/utils/analytics";
import type { Job } from "@/lib/types/job";

const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos

export function useJobSearch() {
  const { data: session } = useSession();
  const profile = useProfile();
  const [companies, setCompanies] = useState<string[]>([]);
  const [roleQueries, setRoleQueries] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleCategories, setRoleCategories] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: "success" | "error" | "info";
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownLoaded, setCooldownLoaded] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Perfil mínimo: skills >= 3 E (currentRole OU area)
  const minimalProfile = useMemo(() => {
    return profile.skills.length >= 3 && (profile.currentRole || profile.area);
  }, [profile.skills.length, profile.currentRole, profile.area]);

  // Modo recomendado é derivado (logado + perfil completo); não é estado.
  const recommendedMode = useMemo(
    () => !!(session && minimalProfile),
    [session, minimalProfile],
  );

  const loadJobs = useCallback(async (filters?: {
    platform?: string;
    role?: string;
    search?: string;
  }) => {
    setLoading(true);
    const params = new URLSearchParams();

    // Se modo recomendado e logado
    if (recommendedMode && session) {
      params.set("recommended", "1");
    } else {
      // Filtros normais
      if (filters?.platform) params.set("platform", filters.platform);
      if (filters?.role) params.set("role", filters.role);
      if (filters?.search) params.set("search", filters.search);
    }

    try {
      const query = params.toString();
      const res = await fetch(`/api/vagas${query ? "?" + query : ""}`);

      if (!res.ok) {
        if (res.status === 429) {
          setSnackbar({ message: "Muitas buscas em pouco tempo. Aguarde alguns segundos.", severity: "error" });
        } else {
          setSnackbar({ message: "Falha ao carregar vagas. Tente novamente.", severity: "error" });
        }
        return;
      }

      const data = await res.json();
      const loadedJobs = Array.isArray(data) ? data : [];
      setJobs(loadedJobs);

      if (!session && loadedJobs.length > 0) await browserStorage.setJobs(loadedJobs);

      const uniqueRoleCategories = uniqueValues(loadedJobs.map((j: Job) => j.roleCategory)) as string[];
      setRoleCategories(uniqueRoleCategories);
    } catch {
      setSnackbar({ message: "Erro de conexão ao carregar vagas.", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [recommendedMode, session]);

  // Carregar vagas salvas na montagem (para logados e anônimos)
  useEffect(() => {
    if (session) {
      // Adiado para fora do effect síncrono (evita setState em cascata)
      queueMicrotask(() => {
        void loadJobs();
      });
    } else {
      let cancelled = false;
      browserStorage.getJobs().then((stored) => {
        if (!cancelled && stored.length > 0) setJobs(stored as Job[]);
      }).catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [session, loadJobs]);

  // Carregar timestamp da última busca
  useEffect(() => {
    browserStorage.getLastRunAt().then((ts) => {
      if (ts) setLastRunAt(ts);
    }).catch(() => {});
  }, []);

  // Carregar filtros persistidos (companies/roles) na montagem
  useEffect(() => {
    browserStorage.getFilters().then((filters) => {
      if (filters) {
        if (Array.isArray(filters.companies)) setCompanies(filters.companies);
        if (Array.isArray(filters.roles)) setRoleQueries(filters.roles);
      }
    }).catch(() => {})
      .finally(() => setFiltersLoaded(true));
  }, []);

  // Persistir filtros a cada alteração
  useEffect(() => {
    void browserStorage.setFilters({ companies, roles: roleQueries }).catch(() => {});
  }, [companies, roleQueries]);

  useEffect(() => {
    browserStorage.getCooldownEnd().then((endsAt) => {
      if (endsAt) {
        const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        if (remaining > 0) setCooldown(remaining);
        else void browserStorage.clearCooldown();
      }
    }).catch(() => {})
      .finally(() => setCooldownLoaded(true));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          void browserStorage.clearCooldown();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function addSuggestion(role: string) {
    if (!roleQueries.includes(role)) {
      setRoleQueries([...roleQueries, role]);
    }
  }

  const handleStart = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false;

    if (isSilent) {
      setAutoSyncing(true);
    } else {
      setRunning(true);
      setJobs([]);
      if (!session) await browserStorage.clear();
      trackJobSearch({ companies, roles: roleQueries });
    }

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies, queries: roleQueries, auto: isSilent }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429 && body.retryAfter) {
          // Auto-sync silencioso não aplica cooldown — só a busca manual limita.
          if (!isSilent) {
            const endsAt = Date.now() + body.retryAfter * 1000;
            await browserStorage.setCooldownEnd(endsAt);
            setCooldown(body.retryAfter);
          }
          if (!isSilent) {
            setSnackbar({
              message: body.error || "Muitas requisições. Aguarde.",
              severity: "info",
            });
          }
          // 429 no auto-sync: marca "última tentativa" para o effect não
          // re-disparar em loop (cross-reload também fica protegido).
          if (isSilent) {
            const now = Date.now();
            setLastRunAt(now);
            void browserStorage.setLastRunAt(now);
          }
        } else if (!isSilent) {
          setSnackbar({
            message: body.error || "Erro ao iniciar a busca de vagas",
            severity: "error",
          });
        }
        setRunning(false);
        setAutoSyncing(false);
        return;
      }

      const { runId: id, cooldownSeconds: cd } = await res.json();
      // Cooldown só na busca manual; auto-sync retorna 0 e não trava o usuário.
      if (cd && !isSilent) {
        const endsAt = Date.now() + cd * 1000;
        await browserStorage.setCooldownEnd(endsAt);
        setCooldown(cd);
      }

      // Marcar timestamp da busca iniciada com sucesso
      const now = Date.now();
      setLastRunAt(now);
      void browserStorage.setLastRunAt(now);

      const evtSource = new EventSource(`/api/pipeline/stream?runId=${id}`);

      // Watchdog: se o stream nunca emitir um evento terminal nem cair com
      // erro (ex: proxy bufferizando a resposta SSE), evita travar a UI para sempre.
      const watchdog = setTimeout(() => {
        evtSource.close();
        setRunning(false);
        setAutoSyncing(false);
        if (!isSilent) {
          setSnackbar({ message: "A busca demorou mais que o esperado. Tente novamente.", severity: "error" });
        }
        loadJobs().catch(() => {});
      }, 180_000);

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
            setRunning(false);
            setAutoSyncing(false);

            if (
              !session &&
              data.type === "pipeline_complete" &&
              Array.isArray(data.jobs)
            ) {
              const completedJobs: Job[] = data.jobs.map((j) => ({
                ...j,
                detectedAt: j.detectedAt || "",
              }));
              setJobs(completedJobs);
              await browserStorage.setJobs(data.jobs);
              const uniqueRoleCategories = uniqueValues(
                completedJobs.map((j: Job) => j.roleCategory),
              );
              setRoleCategories(uniqueRoleCategories);
            } else {
              loadJobs();
            }

            if (!isSilent) {
              setSnackbar({
                message: data.message || "Busca de vagas concluída!",
                severity: data.type === "pipeline_complete" ? "success" : "error",
              });
            }
          }
        } catch {
          clearTimeout(watchdog);
          evtSource.close();
          setRunning(false);
          setAutoSyncing(false);
          if (!isSilent) {
            setSnackbar({ message: "Erro ao processar a busca. Tente novamente.", severity: "error" });
          }
        }
      };

      evtSource.onerror = () => {
        clearTimeout(watchdog);
        evtSource.close();
        setRunning(false);
        setAutoSyncing(false);
        if (!isSilent) {
          setSnackbar({ message: "Falha na conexão com a busca. Tente novamente.", severity: "error" });
        }
        loadJobs().catch(() => {});
      };
    } catch {
      if (!isSilent) {
        setSnackbar({ message: "Erro ao iniciar a busca de vagas", severity: "error" });
      }
      setRunning(false);
      setAutoSyncing(false);
    }
  }, [companies, roleQueries, session, loadJobs]);

  // Auto-sync na montagem se o tempo decorrido for > 15min e cooldown for 0
  const handleStartRef = useRef(handleStart);
  useEffect(() => {
    handleStartRef.current = handleStart;
  });

  // Evita loop de auto-sync na mesma aba: se o servidor devolver 429 (limiter
  // de auto cheio) sem atualizar lastRunAt, o effect re-dispararia infinito.
  const lastAutoSyncAttemptRef = useRef(0);

  useEffect(() => {
    // Só decide após cooldown e filtros serem carregados do storage, e pula
    // quando não há filtros salvos (evita "vagas aleatórias" na entrada).
    if (
      !cooldownLoaded ||
      !filtersLoaded ||
      cooldown > 0 ||
      running ||
      autoSyncing
    ) return;
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
        void handleStartRef.current({ silent: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cooldown, running, autoSyncing, cooldownLoaded, filtersLoaded, companies, roleQueries]);

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
