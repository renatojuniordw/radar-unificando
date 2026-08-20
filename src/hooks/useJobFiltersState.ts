"use client";

import { useState, useEffect, useCallback } from "react";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";

/**
 * Estado isolado dos filtros de busca de vagas.
 * Responsabilidades: companies, roleQueries, clientFilter,
 * persistência em browserStorage, e addSuggestion.
 */
export function useJobFiltersState(urlQuery: string | null) {
  const [companies, setCompanies] = useState<string[]>([]);
  const [roleQueries, setRoleQueries] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState("");
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Carregar filtros persistidos na montagem
  useEffect(() => {
    browserStorage
      .getFilters()
      .then((filters) => {
        if (filters) {
          if (Array.isArray(filters.companies)) setCompanies(filters.companies);
          if (Array.isArray(filters.roles) && !urlQuery) {
            setRoleQueries(filters.roles);
          }
        }
      })
      .catch(() => {})
      .finally(() => setFiltersLoaded(true));
  }, [urlQuery]);

  // Persistir filtros a cada alteração
  useEffect(() => {
    void browserStorage
      .setFilters({ companies, roles: roleQueries })
      .catch(() => {});
  }, [companies, roleQueries]);

  const addSuggestion = useCallback(
    (role: string) => {
      if (!roleQueries.includes(role)) {
        setRoleQueries([...roleQueries, role]);
      }
    },
    [roleQueries],
  );

  return {
    companies,
    setCompanies,
    roleQueries,
    setRoleQueries,
    clientFilter,
    setClientFilter,
    filtersLoaded,
    addSuggestion,
  };
}
