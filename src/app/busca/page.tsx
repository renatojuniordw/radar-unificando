"use client";

import { Snackbar, Alert, Box, Container } from "@mui/material";
import { useJobSearch } from "@/hooks/useJobSearch";
import { BuscaHeader } from "@/components/busca/busca-header";
import { LoadingOverlay } from "@/components/home/loading-overlay";
import { ResultsSection } from "@/components/home/results-section";
import { CourseRecommendationSidebar } from "@/components/busca/course-recommendation-sidebar";
import { ChatTeaser } from "@/components/shared/chat-teaser";

export default function BuscaPage() {
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
    roleCategories,
    snackbar,
    setSnackbar,
    cooldown,
    recommendedMode,
    loadJobs,
    addSuggestion,
    handleStart,
  } = useJobSearch();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#020617", pb: 6 }}>
      <BuscaHeader
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

      <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ width: "100%", minWidth: 0 }}>
          <ResultsSection
            recommendedMode={recommendedMode}
            jobs={jobs}
            loading={loading}
            autoSyncing={autoSyncing}
            roleCategories={roleCategories}
            areaOrRole={profile.area || profile.currentRole || ""}
            onFilterChange={loadJobs}
          />
        </Box>

        <Box sx={{ width: "100%" }}>
          <CourseRecommendationSidebar
            terms={roleQueries}
            area={profile.area || profile.currentRole}
          />
          {!session && (
            <Box sx={{ mt: 2 }}>
              <ChatTeaser />
            </Box>
          )}
        </Box>
      </Container>

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
    </Box>
  );
}