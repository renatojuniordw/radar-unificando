"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";
import { useProfile } from "@/hooks/useProfile";
import { uniqueValues } from "@/lib/array";
import type { Vaga } from "@/lib/types/vaga";

const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos

export function useJobSearch() {
  const { data: session } = useSession();
  const profile = useProfile();
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [cargosBusca, setCargosBusca] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [cargos, setCargos] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: "success" | "error" | "info";
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Perfil mínimo: skills >= 3 E (currentRole OU area)
  const perfilMinimo = useMemo(() => {
    return profile.skills.length >= 3 && (profile.currentRole || profile.area);
  }, [profile.skills.length, profile.currentRole, profile.area]);

  // Modo recomendado é derivado (logado + perfil completo); não é estado.
  const modoRecomendado = useMemo(
    () => !!(session && perfilMinimo),
    [session, perfilMinimo],
  );

  const carregarVagas = useCallback(async (filters?: {
    plataforma?: string;
    cargo?: string;
    search?: string;
  }) => {
    setLoading(true);
    const params = new URLSearchParams();

    // Se modo recomendado e logado
    if (modoRecomendado && session) {
      params.set("recomendado", "1");
    } else {
      // Filtros normais
      if (filters?.plataforma) params.set("plataforma", filters.plataforma);
      if (filters?.cargo) params.set("cargo", filters.cargo);
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
      const jobs = Array.isArray(data) ? data : [];
      setVagas(jobs);

      if (!session && jobs.length > 0) await browserStorage.setVagas(jobs);

      const uniqueCargos = uniqueValues(jobs.map((j: Vaga) => j.cargo_categoria)) as string[];
      setCargos(uniqueCargos);
    } catch {
      setSnackbar({ message: "Erro de conexão ao carregar vagas.", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [modoRecomendado, session]);

  // Carregar vagas salvas na montagem (para logados e anônimos)
  useEffect(() => {
    if (session) {
      // Adiado para fora do effect síncrono (evita setState em cascata)
      queueMicrotask(() => {
        void carregarVagas();
      });
    } else {
      let cancelled = false;
      browserStorage.getVagas().then((stored) => {
        if (!cancelled && stored.length > 0) setVagas(stored as Vaga[]);
      }).catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [session, carregarVagas]);

  // Carregar timestamp da última busca
  useEffect(() => {
    browserStorage.getLastRunAt().then((ts) => {
      if (ts) setLastRunAt(ts);
    }).catch(() => {});
  }, []);

  // Carregar filtros persistidos (empresas/cargos) na montagem
  useEffect(() => {
    browserStorage.getFilters().then((filters) => {
      if (!filters) return;
      if (Array.isArray(filters.empresas)) setEmpresas(filters.empresas);
      if (Array.isArray(filters.cargos)) setCargosBusca(filters.cargos);
    }).catch(() => {});
  }, []);

  // Persistir filtros a cada alteração
  useEffect(() => {
    void browserStorage.setFilters({ empresas, cargos: cargosBusca }).catch(() => {});
  }, [empresas, cargosBusca]);

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

  function addSuggestion(cargo: string) {
    if (!cargosBusca.includes(cargo)) {
      setCargosBusca([...cargosBusca, cargo]);
    }
  }

  const handleStart = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false;

    if (isSilent) {
      setAutoSyncing(true);
    } else {
      setRunning(true);
      setVagas([]);
      if (!session) await browserStorage.clear();
    }

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies: empresas, queries: cargosBusca }),
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
            jobs?: Vaga[];
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
              const jobs: Vaga[] = data.jobs.map((j) => ({
                ...j,
                detectado_em: j.detectado_em || "",
              }));
              setVagas(jobs);
              await browserStorage.setVagas(data.jobs);
              const uniqueCargos = uniqueValues(
                jobs.map((j: Vaga) => j.cargo_categoria),
              );
              setCargos(uniqueCargos);
            } else {
              carregarVagas();
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
        carregarVagas().catch(() => {});
      };
    } catch {
      if (!isSilent) {
        setSnackbar({ message: "Erro ao iniciar a busca de vagas", severity: "error" });
      }
      setRunning(false);
      setAutoSyncing(false);
    }
  }, [empresas, cargosBusca, session, carregarVagas]);

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
    empresas,
    setEmpresas,
    cargosBusca,
    setCargosBusca,
    running,
    autoSyncing,
    lastRunAt,
    vagas,
    loading,
    cargos,
    snackbar,
    setSnackbar,
    cooldown,
    modoRecomendado,
    perfilMinimo,
    carregarVagas,
    addSuggestion,
    handleStart,
  };
}
