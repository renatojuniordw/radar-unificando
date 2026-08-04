'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Box, Typography } from '@mui/material';
import { useVagaFilters } from '@/hooks/useVagaFilters';
import { uniqueValues } from '@/lib/array';
import { normalizarModalidade } from '@/lib/vaga';
import { JobPostingSchema } from '@/components/seo/job-posting-schema';
import { trackExportCsv } from '@/lib/analytics';
import type { Vaga } from '@/lib/types/vaga';
import { VagaTableHeader } from '@/components/vaga-table/vaga-table-header';
import { VagaFiltersMobile } from '@/components/vaga-table/vaga-filters-mobile';
import { VagaFiltersDesktop } from '@/components/vaga-table/vaga-filters-desktop';
import { VagaFiltersDrawer } from '@/components/vaga-table/vaga-filters-drawer';
import { VagaLoadingSkeleton } from '@/components/vaga-table/vaga-loading-skeleton';
import { VagaEmptyState } from '@/components/vaga-table/vaga-empty-state';
import { VagaMobileList } from '@/components/vaga-table/vaga-mobile-list';
import { VagaDesktopTable } from '@/components/vaga-table/vaga-desktop-table';

interface Props {
  vagas: Vaga[];
  loading: boolean;
  cargos: string[];
  onExportCsv: () => void;
  onFilterChange: (filters: { plataforma?: string; cargo?: string; search?: string }) => void;
}

export const VagaTable = memo(function VagaTable({ vagas, loading, cargos, onExportCsv, onFilterChange }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paginaMobile, setPaginaMobile] = useState(1);
  const [exporting, setExporting] = useState(false);

  const mobileContainerRef = useRef<HTMLDivElement>(null);

  const {
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
    handleClearFilters: clearFilterState,
    handlePlataformaChange,
    handleCargoChange,
    handleSearch,
  } = useVagaFilters({ onFilterChange });

  function handleExport() {
    if (exporting) return;
    setExporting(true);
    trackExportCsv(vagas.length);
    onExportCsv();
    setTimeout(() => setExporting(false), 2000);
  }

  // Reset mobile page when filters or search change
  useEffect(() => {
    setPaginaMobile(1);
  }, [filtroPlataforma, filtroCargo, filtroBusca, filtroEmpresa, filtroModalidade]);

  function handleClearFilters() {
    setFiltroEmpresa('');
    setFiltroModalidade('');
    clearFilterState();
  }

  const empresas = useMemo(() => uniqueValues(vagas.map(v => v.empresa)).sort(), [vagas]);
  const modalidades = useMemo(() => uniqueValues(vagas.map(v => normalizarModalidade(v.tipo))).sort(), [vagas]);

  const vagasFiltradas = useMemo(() => vagas.filter(v => {
    if (filtroEmpresa && v.empresa !== filtroEmpresa) return false;
    if (filtroModalidade && normalizarModalidade(v.tipo) !== filtroModalidade) return false;
    return true;
  }), [vagas, filtroEmpresa, filtroModalidade]);

  return (
    <>
      <JobPostingSchema
        jobs={vagasFiltradas.map((v) => ({
          title: v.titulo_vaga,
          company: v.empresa,
          location: v.local,
          type: v.tipo,
          url: v.link,
          datePosted: v.detectado_em,
        }))}
      />
      <Box
        className="card-brutalist"
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          bgcolor: '#ffffff',
          border: '3px solid #020617',
          boxShadow: { xs: '4px 4px 0px #000', md: '6px 6px 0px #000' },
        }}
      >
        <VagaTableHeader
          totalVagas={vagas.length}
          totalFiltradas={vagasFiltradas.length}
          exporting={exporting}
          onExport={handleExport}
        />

        {/* MOBILE CONTROLS HEADER (Strictly xs & sm screens <768px) */}
        <VagaFiltersMobile
          filtroBusca={filtroBusca}
          onBuscaChange={setFiltroBusca}
          onSubmit={handleSearch}
          countSecondaryFilters={countSecondaryFilters}
          countTotalFilters={countTotalFilters}
          onOpenDrawer={() => setDrawerOpen(true)}
          onClearFilters={handleClearFilters}
        />

        {/* DESKTOP FILTERS GRID (Strictly md screens and up >=768px) */}
        <VagaFiltersDesktop
          filtroPlataforma={filtroPlataforma}
          onPlataformaChange={handlePlataformaChange}
          empresas={empresas}
          filtroEmpresa={filtroEmpresa}
          onEmpresaChange={setFiltroEmpresa}
          modalidades={modalidades}
          filtroModalidade={filtroModalidade}
          onModalidadeChange={setFiltroModalidade}
          cargos={cargos}
          filtroCargo={filtroCargo}
          onCargoChange={handleCargoChange}
          filtroBusca={filtroBusca}
          onBuscaChange={setFiltroBusca}
          onSubmit={handleSearch}
        />

        {/* MOBILE BOTTOM FILTER DRAWER */}
        <VagaFiltersDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          filtroPlataforma={filtroPlataforma}
          onPlataformaChange={handlePlataformaChange}
          empresas={empresas}
          filtroEmpresa={filtroEmpresa}
          onEmpresaChange={setFiltroEmpresa}
          modalidades={modalidades}
          filtroModalidade={filtroModalidade}
          onModalidadeChange={setFiltroModalidade}
          cargos={cargos}
          filtroCargo={filtroCargo}
          onCargoChange={handleCargoChange}
          totalFiltradas={vagasFiltradas.length}
          countSecondaryFilters={countSecondaryFilters}
          onClearFilters={handleClearFilters}
        />

        {/* RESULTS DISPLAY AREA */}
        {loading ? (
          <VagaLoadingSkeleton />
        ) : vagasFiltradas.length === 0 ? (
          <VagaEmptyState
            hasVagas={vagas.length > 0}
            countTotalFilters={countTotalFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <>
            {/* MOBILE CARDS FEED WITH PAGINATION (xs & sm screens <768px) */}
            <VagaMobileList
              vagas={vagasFiltradas}
              containerRef={mobileContainerRef}
              pagina={paginaMobile}
              onPaginaChange={setPaginaMobile}
            />

            {/* DESKTOP TABLE VIEW (md screens and up >=768px) */}
            <VagaDesktopTable vagas={vagasFiltradas} />
          </>
        )}

        {!loading && vagasFiltradas.length > 0 && (
          <Typography sx={{ mt: 2, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Exibindo {vagasFiltradas.length} vaga{vagasFiltradas.length === 1 ? '' : 's'}
          </Typography>
        )}
      </Box>
    </>
  );
});
