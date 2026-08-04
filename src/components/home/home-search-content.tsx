"use client";

import { Snackbar, Alert } from "@mui/material";
import { useJobSearch } from "@/hooks/useJobSearch";
import { HeroSection } from "@/components/home/hero-section";
import { LoadingOverlay } from "@/components/home/loading-overlay";
import { ResultsSection } from "@/components/home/results-section";

export function HomeSearchContent() {
  const {
    session,
    profile,
    companies,
    setCompanies,
    roleQueries,
    setRoleQueries,
    running,
    autoSyncing,
    jobs,
    loading,
    cargos,
    snackbar,
    setSnackbar,
    cooldown,
    recommendedMode,
    minimalProfile,
    loadJobs,
    addSuggestion,
    handleStart,
  } = useJobSearch();

  return (
    <>
      <HeroSection
        isLoggedIn={!!session}
        minimalProfile={!!minimalProfile}
        companies={companies}
        onCompaniesChange={setCompanies}
        roleQueries={roleQueries}
        onRoleQueriesChange={setRoleQueries}
        cooldown={cooldown}
        running={running}
        onStart={handleStart}
        onAddSuggestion={addSuggestion}
      />

      {running && <LoadingOverlay />}

      <ResultsSection
        recommendedMode={recommendedMode}
        jobs={jobs}
        loading={loading}
        autoSyncing={autoSyncing}
        cargos={cargos}
        areaOuCargo={profile.area || profile.currentRole || ""}
        onFilterChange={loadJobs}
      />

      {snackbar && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(null)}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}
