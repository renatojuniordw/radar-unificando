"use client";

import { useState, useEffect, useCallback } from "react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";

/**
 * Hook responsável por gerenciar o cooldown entre buscas de pipeline.
 * Extraído de useJobSearch para separar responsabilidades (SRP).
 *
 * Funcionalidades:
 * - Carrega cooldown pendente do storage na montagem
 * - Executa contagem regressiva a cada segundo
 * - Limpa cooldown do storage ao expirar
 * - Expõe `startCooldown` para iniciar cooldown a partir de uma resposta 429
 */
export function useCooldown() {
  const [cooldown, setCooldown] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Carrega cooldown pendente do storage na montagem
  useEffect(() => {
    browserStorage
      .getCooldownEnd()
      .then((endsAt) => {
        if (endsAt) {
          const remaining = Math.max(
            0,
            Math.ceil((endsAt - Date.now()) / 1000),
          );
          if (remaining > 0) setCooldown(remaining);
          else void browserStorage.clearCooldown();
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Contagem regressiva: decrementa a cada segundo e limpa storage ao expirar
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

  /** Inicia cooldown a partir de segundos (ex.: resposta 429 da API). */
  const startCooldown = useCallback(async (seconds: number) => {
    const endsAt = Date.now() + seconds * 1000;
    await browserStorage.setCooldownEnd(endsAt);
    setCooldown(seconds);
  }, []);

  return { cooldown, setCooldown, loaded, startCooldown };
}
