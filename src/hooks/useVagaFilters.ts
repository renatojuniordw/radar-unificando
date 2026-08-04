'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

export interface VagaFilterChange {
  plataforma?: string;
  cargo?: string;
  search?: string;
}

interface UseVagaFiltersParams {
  onFilterChange: (filters: VagaFilterChange) => void;
}

export function useVagaFilters({ onFilterChange }: UseVagaFiltersParams) {
  const [filtroPlataforma, setFiltroPlataforma] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [debouncedSearch] = useDebounce(filtroBusca, 300);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');

  const countSecondaryFilters = [
    filtroPlataforma,
    filtroEmpresa,
    filtroModalidade,
    filtroCargo,
  ].filter(Boolean).length;

  const countTotalFilters = countSecondaryFilters + (filtroBusca ? 1 : 0);

  function handleClearFilters() {
    setFiltroPlataforma('');
    setFiltroEmpresa('');
    setFiltroModalidade('');
    setFiltroCargo('');
    setFiltroBusca('');
    onFilterChange({});
  }

  function handleFilterChange(updates: { plataforma?: string; cargo?: string }) {
    const plataforma = updates.plataforma ?? filtroPlataforma;
    const cargo = updates.cargo ?? filtroCargo;
    onFilterChange({
      plataforma: plataforma || undefined,
      cargo: cargo || undefined,
      search: filtroBusca || undefined,
    });
  }

  function handlePlataformaChange(value: string) {
    setFiltroPlataforma(value);
    handleFilterChange({ plataforma: value });
  }

  function handleCargoChange(value: string) {
    setFiltroCargo(value);
    handleFilterChange({ cargo: value });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    onFilterChange({
      plataforma: filtroPlataforma || undefined,
      cargo: filtroCargo || undefined,
      search: filtroBusca || undefined,
    });
  }

  // Trigger search on debounced value
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onFilterChange({
        plataforma: filtroPlataforma || undefined,
        cargo: filtroCargo || undefined,
        search: debouncedSearch || undefined,
      });
    }
  }, [debouncedSearch, filtroPlataforma, filtroCargo, onFilterChange]);

  return {
    filtroPlataforma,
    filtroCargo,
    filtroBusca,
    setFiltroBusca,
    filtroEmpresa,
    setFiltroEmpresa,
    filtroModalidade,
    setFiltroModalidade,
    countSecondaryFilters,
    countTotalFilters,
    handleClearFilters,
    handlePlataformaChange,
    handleCargoChange,
    handleSearch,
  };
}
