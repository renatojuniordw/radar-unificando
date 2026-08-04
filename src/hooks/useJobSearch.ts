"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";
import { useProfile } from "@/hooks/useProfile";
import type { Vaga } from "@/lib/types/vaga";

export function useJobSearch() {
  const { data: session } = useSession();
  const profile = useProfile();
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [cargosBusca, setCargosBusca] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [cargos, setCargos] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: "success" | "error" | "info";
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [modoRecomendado, setModoRecomendado] = useState(false);

  // Perfil mínimo: skills >= 3 E (currentRole OU area)
  const perfilMinimo = useMemo(() => {
    return profile.skills.length >= 3 && (profile.currentRole || profile.area);
  }, [profile.skills.length, profile.currentRole, profile.area]);

  useEffect(() => {
    if (!session && vagas.length === 0) {
      let cancelled = false;
      browserStorage.getVagas().then((stored) => {
        if (!cancelled && stored.length > 0) setVagas(stored as Vaga[]);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [session]);

  // Carregar filtros persistidos (empresas/cargos) na montagem
  useEffect(() => {
    browserStorage.getFilters().then((filters) => {
      if (!filters) return;
      if (Array.isArray(filters.empresas)) setEmpresas(filters.empresas);
      if (Array.isArray(filters.cargos)) setCargosBusca(filters.cargos);
    });
  }, []);

  // Persistir filtros a cada alteração
  useEffect(() => {
    void browserStorage.setFilters({ empresas, cargos: cargosBusca });
  }, [empresas, cargosBusca]);

  // Ativar modo recomendado quando logado + perfil pronto
  useEffect(() => {
    if (session && perfilMinimo) {
      setModoRecomendado(true);
      // Pré-preenche cargo
      if (profile.currentRole || profile.area) {
        setCargosBusca([profile.currentRole || profile.area]);
      }
    }
  }, [session, perfilMinimo, profile.currentRole, profile.area]);

  useEffect(() => {
    browserStorage.getCooldownEnd().then((endsAt) => {
      if (endsAt) {
        const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        if (remaining > 0) setCooldown(remaining);
        else void browserStorage.clearCooldown();
      }
    });
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
  }, [cooldown > 0]);

  async function carregarVagas(filters?: {
    plataforma?: string;
    cargo?: string;
    search?: string;
  }) {
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

    const query = params.toString();
    const res = await fetch(`/api/vagas${query ? "?" + query : ""}`);
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : [];
    setVagas(jobs);

    if (!session && jobs.length > 0) await browserStorage.setVagas(jobs);

    const uniqueCargos = [
      ...new Set(jobs.map((j: Vaga) => j.cargo_categoria).filter(Boolean)),
    ] as string[];
    setCargos(uniqueCargos);
    setLoading(false);
  }

  function addSuggestion(cargo: string) {
    if (!cargosBusca.includes(cargo)) {
      setCargosBusca([...cargosBusca, cargo]);
    }
  }

  async function handleStart() {
    setRunning(true);
    setVagas([]);
    if (!session) await browserStorage.clear();

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
          setSnackbar({
            message: body.error || "Muitas requisições. Aguarde.",
            severity: "info",
          });
        } else {
          setSnackbar({
            message: body.error || "Erro ao iniciar pipeline",
            severity: "error",
          });
        }
        setRunning(false);
        return;
      }

      const { runId: id, cooldownSeconds: cd } = await res.json();
      if (cd) {
        const endsAt = Date.now() + cd * 1000;
        await browserStorage.setCooldownEnd(endsAt);
        setCooldown(cd);
      }
      const evtSource = new EventSource(`/api/pipeline/stream?runId=${id}`);

      evtSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (
            data.type === "pipeline_complete" ||
            data.type === "pipeline_error" ||
            data.type === "pipeline_cancelled"
          ) {
            evtSource.close();
            setRunning(false);

            if (
              !session &&
              data.type === "pipeline_complete" &&
              Array.isArray(data.jobs)
            ) {
              const jobs: Vaga[] = data.jobs.map((j: any) => ({
                ...j,
                detectado_em: j.detectado_em || "",
              }));
              setVagas(jobs);
              await browserStorage.setVagas(data.jobs);
              const uniqueCargos = [
                ...new Set(
                  jobs.map((j: Vaga) => j.cargo_categoria).filter(Boolean),
                ),
              ];
              setCargos(uniqueCargos);
            } else {
              carregarVagas();
            }

            setSnackbar({
              message: data.message || "Pipeline concluído!",
              severity: data.type === "pipeline_complete" ? "success" : "error",
            });
          }
        } catch {
          /* ignore */
        }
      };

      evtSource.onerror = () => {
        evtSource.close();
        setRunning(false);
        carregarVagas();
      };
    } catch {
      setSnackbar({ message: "Erro ao iniciar pipeline", severity: "error" });
      setRunning(false);
    }
  }

  return {
    session,
    profile,
    empresas,
    setEmpresas,
    cargosBusca,
    setCargosBusca,
    running,
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
