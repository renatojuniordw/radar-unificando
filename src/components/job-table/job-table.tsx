'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Box, Typography } from '@mui/material';
import { useJobFilters } from '@/hooks/useJobFilters';
import { uniqueValues } from '@/lib/utils/array';
import { normalizeJobType } from '@/lib/utils/job';
import { JobPostingSchema } from '@/components/seo/job-posting-schema';
import { trackExportCsv } from '@/lib/utils/analytics';
import type { Job } from '@/lib/types/job';
import { JobTableHeader } from '@/components/job-table/job-table-header';
import { JobFiltersMobile } from '@/components/job-table/job-filters-mobile';
import { JobFiltersDesktop } from '@/components/job-table/job-filters-desktop';
import { JobFiltersDrawer } from '@/components/job-table/job-filters-drawer';
import { JobLoadingSkeleton } from '@/components/job-table/job-loading-skeleton';
import { JobEmptyState } from '@/components/job-table/job-empty-state';
import { JobMobileList } from '@/components/job-table/job-mobile-list';
import { JobDesktopTable } from '@/components/job-table/job-desktop-table';

interface Props {
  jobs: Job[];
  loading: boolean;
  roleCategories: string[];
  onExportCsv: () => void;
  onFilterChange: (filters: { platform?: string; role?: string; search?: string }) => void;
}

export const JobTable = memo(function JobTable({ jobs, loading, roleCategories, onExportCsv, onFilterChange }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobilePage, setMobilePage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const mobileContainerRef = useRef<HTMLDivElement>(null);

  const {
    platformFilter,
    roleFilter,
    searchFilter,
    setSearchFilter,
    companyFilter,
    setCompanyFilter,
    typeFilter,
    setTypeFilter,
    countSecondaryFilters,
    countTotalFilters,
    handleClearFilters: clearFilterState,
    handlePlatformChange,
    handleRoleChange,
    handleSearch,
  } = useJobFilters({ onFilterChange });

  function handleExport() {
    if (exporting) return;
    setExporting(true);
    trackExportCsv(jobs.length);
    onExportCsv();
    setTimeout(() => setExporting(false), 2000);
  }

  // Reset mobile page when filters or search change
  useEffect(() => {
    setMobilePage(1);
  }, [platformFilter, roleFilter, searchFilter, companyFilter, typeFilter]);

  function handleClearFilters() {
    setCompanyFilter('');
    setTypeFilter('');
    clearFilterState();
  }

  const companies = useMemo(() => uniqueValues(jobs.map(j => j.company)).sort(), [jobs]);
  const types = useMemo(() => uniqueValues(jobs.map(j => normalizeJobType(j.type))).sort(), [jobs]);

  const filteredJobs = useMemo(() => jobs.filter(j => {
    if (companyFilter && j.company !== companyFilter) return false;
    if (typeFilter && normalizeJobType(j.type) !== typeFilter) return false;
    return true;
  }), [jobs, companyFilter, typeFilter]);

  return (
    <>
      <JobPostingSchema
        jobs={filteredJobs.map((j) => ({
          title: j.title,
          company: j.company,
          location: j.location,
          type: j.type,
          url: j.link,
          datePosted: j.detectedAt,
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
        <JobTableHeader
          totalJobs={jobs.length}
          filteredTotal={filteredJobs.length}
          exporting={exporting}
          onExport={handleExport}
        />

        {/* MOBILE CONTROLS HEADER (Strictly xs & sm screens <768px) */}
        <JobFiltersMobile
          searchFilter={searchFilter}
          onSearchChange={setSearchFilter}
          onSubmit={handleSearch}
          countSecondaryFilters={countSecondaryFilters}
          countTotalFilters={countTotalFilters}
          onOpenDrawer={() => setDrawerOpen(true)}
          onClearFilters={handleClearFilters}
        />

        {/* DESKTOP FILTERS GRID (Strictly md screens and up >=768px) */}
        <JobFiltersDesktop
          platformFilter={platformFilter}
          onPlatformChange={handlePlatformChange}
          companies={companies}
          companyFilter={companyFilter}
          onCompanyChange={setCompanyFilter}
          types={types}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          roles={roleCategories}
          roleFilter={roleFilter}
          onRoleChange={handleRoleChange}
          searchFilter={searchFilter}
          onSearchChange={setSearchFilter}
          onSubmit={handleSearch}
        />

        {/* MOBILE BOTTOM FILTER DRAWER */}
        <JobFiltersDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          platformFilter={platformFilter}
          onPlatformChange={handlePlatformChange}
          companies={companies}
          companyFilter={companyFilter}
          onCompanyChange={setCompanyFilter}
          types={types}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          roles={roleCategories}
          roleFilter={roleFilter}
          onRoleChange={handleRoleChange}
          filteredTotal={filteredJobs.length}
          countSecondaryFilters={countSecondaryFilters}
          onClearFilters={handleClearFilters}
        />

        {/* RESULTS DISPLAY AREA */}
        {loading ? (
          <JobLoadingSkeleton />
        ) : filteredJobs.length === 0 ? (
          <JobEmptyState
            hasJobs={jobs.length > 0}
            countTotalFilters={countTotalFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <>
            {/* MOBILE CARDS FEED WITH PAGINATION (xs & sm screens <768px) */}
            <JobMobileList
              jobs={filteredJobs}
              containerRef={mobileContainerRef}
              page={mobilePage}
              onPageChange={setMobilePage}
            />

            {/* DESKTOP TABLE VIEW (md screens and up >=768px) */}
            <JobDesktopTable jobs={filteredJobs} />
          </>
        )}

        {!loading && filteredJobs.length > 0 && (
          <Typography sx={{ mt: 2, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Exibindo {filteredJobs.length} vaga{filteredJobs.length === 1 ? '' : 's'}
          </Typography>
        )}
      </Box>
    </>
  );
});
