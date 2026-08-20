"use client";

import { Suspense, useState } from "react";
import { Snackbar, Alert, Box, Container } from "@mui/material";
import { useJobSearch } from "@/hooks/useJobSearch";
import { BuscaHeader } from "@/components/busca/busca-header";
import { LoadingOverlay } from "@/components/home/loading-overlay";
import { ResultsSection } from "@/components/home/results-section";
import { CourseRecommendationSidebar } from "@/components/busca/course-recommendation-sidebar";
import { ChatTeaser } from "@/components/shared/chat-teaser";
import { AtsAnalysisDrawer } from "@/components/ats/ats-analysis-drawer";
import { downloadAdaptedResume, jobKey } from "@/lib/client/resume-download";
import { ResumeProgressToast, type ResumeProgressState } from "@/components/resume/resume-progress-toast";
import type { Job } from "@/lib/types/job";

function BuscaPageContent({ initialJobs }: { initialJobs: Job[] }) {
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
  } = useJobSearch(initialJobs);

  const [atsJob, setAtsJob] = useState<Job | null>(null);
  const [generatingJobKey, setGeneratingJobKey] = useState<string | null>(null);
  const [resumeToastState, setResumeToastState] = useState<ResumeProgressState | null>(null);
  const canGenerateResume = !!(session && (profile.resumeMarkdown || profile.resumeText));

  const handleGenerateResume = async (job: Job) => {
    const key = jobKey(job);
    setGeneratingJobKey(key);
    setResumeToastState({
      jobTitle: job.title,
      jobCompany: job.company || "",
      step: 1,
      totalSteps: 3,
      message: "Analisando requisitos da vaga e palavras-chave ATS...",
      progressPercent: 20,
      status: "generating",
    });
    try {
      await downloadAdaptedResume(job, (stepInfo) => {
        setResumeToastState({
          jobTitle: job.title,
          jobCompany: job.company || "",
          step: stepInfo.step,
          totalSteps: stepInfo.totalSteps,
          message: stepInfo.message,
          progressPercent: stepInfo.progressPercent,
          status: "generating",
        });
      });
      setResumeToastState({
        jobTitle: job.title,
        jobCompany: job.company || "",
        step: 3,
        totalSteps: 3,
        message: "Currículo confeccionado com sucesso! O download do PDF começou.",
        progressPercent: 100,
        status: "success",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar o currículo.";
      setResumeToastState({
        jobTitle: job.title,
        jobCompany: job.company || "",
        step: 0,
        totalSteps: 3,
        message: msg,
        progressPercent: 0,
        status: "error",
        errorMessage: msg,
      });
    } finally {
      setGeneratingJobKey(null);
    }
  };

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
        onAddCompany={(company) =>
          setCompanies((prev) =>
            prev.includes(company) ? prev : [...prev, company],
          )
        }
      />

      {running && <LoadingOverlay />}

      <Container
        maxWidth="xl"
        sx={{ pt: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Box sx={{ width: "100%", minWidth: 0 }}>
          <ResultsSection
            recommendedMode={recommendedMode}
            jobs={jobs}
            loading={loading}
            autoSyncing={autoSyncing}
            roleCategories={roleCategories}
            areaOrRole={profile.area || profile.currentRole || ""}
            onFilterChange={loadJobs}
            canGenerateResume={canGenerateResume}
            onGenerateResume={handleGenerateResume}
            generatingJobKey={generatingJobKey}
            onAnalyzeAts={setAtsJob}
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
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar(null)}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}

      <ResumeProgressToast
        state={resumeToastState}
        onClose={() => setResumeToastState(null)}
      />

      <AtsAnalysisDrawer
        open={!!atsJob}
        job={atsJob}
        onClose={() => setAtsJob(null)}
      />
    </Box>
  );
}

export function BuscaClient({ initialJobs }: { initialJobs: Job[] }) {
  // useSearchParams (usado no useJobSearch) exige Suspense durante o prerender.
  return (
    <Suspense fallback={null}>
      <BuscaPageContent initialJobs={initialJobs} />
    </Suspense>
  );
}
