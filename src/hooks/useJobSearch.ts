"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";
import { useProfile } from "@/hooks/useProfile";
import { uniqueValues } from "@/lib/array";
import { trackJobSearch } from "@/lib/analytics";
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
      if (!filters) return;
      if (Array.isArray(filters.companies)) setCompanies(filters.companies);
      if (Array.isArray(filters.roles)) setRoleQueries(filters.roles);
    }).catch(() => {});
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
    }).catch(() => {});
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
        body: JSON.stringify({ companies, queries: roleQueries }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429 && body.retryAfter) {
          const endsAt = Date.now() + body.retryAfter * 1000;
          await browserStorage.setCooldownEnd(endsAt);
          setCooldown(body.retryAfter);
          if (!isSilent) {
            setSnackbar({
              message: body.error || "Muitas requisições. Aguarde.",
              severity: "info",
            });
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
      if (cd) {
        const endsAt = Date.now() + cd * 1000;
        await browserStorage.setCooldownEnd(endsAt);
        setCooldown(cd);
      }

      // Marcar timestamp da busca iniciada com sucesso
      const now = Date.now();
      setLastRunAt(now);
      void browserStorage.setLastRunAt(now);

      const evtSource = new EventSource(`/api/pipeline/stream?runId=${id}`);

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
          evtSource.close();
          setRunning(false);
          setAutoSyncing(false);
          if (!isSilent) {
            setSnackbar({ message: "Erro ao processar a busca. Tente novamente.", severity: "error" });
          }
        }
      };

      evtSource.onerror = () => {
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

  useEffect(() => {
    if (cooldown > 0 || running || autoSyncing) return;

    let cancelled = false;
    browserStorage.getLastRunAt().then((ts) => {
      if (cancelled) return;
      const now = Date.now();
      if (ts && now - ts > AUTO_SYNC_INTERVAL_MS) {
        void handleStartRef.current({ silent: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cooldown, running, autoSyncing]);

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
