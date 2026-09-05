'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

export interface JobFilterChange {
  platform?: string;
  role?: string;
  search?: string;
  location?: string;
}

interface UseJobFiltersParams {
  onFilterChange: (filters: JobFilterChange) => void;
}

export function useJobFilters({ onFilterChange }: UseJobFiltersParams) {
  const [platformFilter, setPlatformFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearch] = useDebounce(searchFilter, 300);
  const [companyFilter, setCompanyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const countSecondaryFilters = [
    platformFilter,
    companyFilter,
    typeFilter,
    roleFilter,
    locationFilter,
  ].filter(Boolean).length;

  const countTotalFilters = countSecondaryFilters + (searchFilter ? 1 : 0);

  function handleClearFilters() {
    setPlatformFilter('');
    setCompanyFilter('');
    setTypeFilter('');
    setRoleFilter('');
    setSearchFilter('');
    setLocationFilter('');
    onFilterChange({});
  }

  function handleFilterChange(updates: { platform?: string; role?: string }) {
    const platform = updates.platform ?? platformFilter;
    const role = updates.role ?? roleFilter;
    onFilterChange({
      platform: platform || undefined,
      role: role || undefined,
      search: searchFilter || undefined,
      location: locationFilter || undefined,
    });
  }

  function handlePlatformChange(value: string) {
    setPlatformFilter(value);
    handleFilterChange({ platform: value });
  }

  function handleRoleChange(value: string) {
    setRoleFilter(value);
    handleFilterChange({ role: value });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    onFilterChange({
      platform: platformFilter || undefined,
      role: roleFilter || undefined,
      search: searchFilter || undefined,
      location: locationFilter || undefined,
    });
  }

  // Trigger search on debounced value
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onFilterChange({
        platform: platformFilter || undefined,
        role: roleFilter || undefined,
        search: debouncedSearch || undefined,
        location: locationFilter || undefined,
      });
    }
  }, [debouncedSearch, platformFilter, roleFilter, locationFilter, onFilterChange]);

  return {
    platformFilter,
    roleFilter,
    searchFilter,
    setSearchFilter,
    companyFilter,
    setCompanyFilter,
    typeFilter,
    setTypeFilter,
    locationFilter,
    setLocationFilter,
    countSecondaryFilters,
    countTotalFilters,
    handleClearFilters,
    handlePlatformChange,
    handleRoleChange,
    handleSearch,
  };
}
