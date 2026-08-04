"use client";

import { Snackbar } from "@mui/material";
import { useJobSearch } from "@/hooks/useJobSearch";
import { HeroSection } from "@/components/home/hero-section";
import { LoadingOverlay } from "@/components/home/loading-overlay";
import { ResultsSection } from "@/components/home/results-section";
import { WhyUseSection } from "@/components/home/why-use-section";
import { FaqSection } from "@/components/home/faq-section";

export default function HomePage() {
  const {
    session,
    profile,
    empresas,
    setEmpresas,
    cargosBusca,
    setCargosBusca,
    running,
    autoSyncing,
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
  } = useJobSearch();

  return (
    <>
      <HeroSection
        isLoggedIn={!!session}
        perfilCompleto={!!perfilMinimo}
        empresas={empresas}
        onEmpresasChange={setEmpresas}
        cargosBusca={cargosBusca}
        onCargosBuscaChange={setCargosBusca}
        cooldown={cooldown}
        running={running}
        onStart={handleStart}
        onAddSuggestion={addSuggestion}
      />

      {running && <LoadingOverlay />}

      <ResultsSection
        modoRecomendado={modoRecomendado}
        vagas={vagas}
        loading={loading}
        autoSyncing={autoSyncing}
        cargos={cargos}
        areaOuCargo={profile.area || profile.currentRole || ""}
        onFilterChange={carregarVagas}
      />

      <WhyUseSection />

      <FaqSection />

      {snackbar && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          message={snackbar.message}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      )}
    </>
  );
}
