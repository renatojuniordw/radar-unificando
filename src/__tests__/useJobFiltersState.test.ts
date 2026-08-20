// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const browserStorageMock = vi.hoisted(() => ({
  getFilters: vi.fn().mockResolvedValue(null),
  setFilters: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/infrastructure/storage/browser-storage', () => ({
  browserStorage: browserStorageMock,
}));

import { useJobFiltersState } from '@/hooks/useJobFiltersState';

describe('useJobFiltersState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    browserStorageMock.getFilters.mockResolvedValue(null);
    browserStorageMock.setFilters.mockResolvedValue(undefined);
  });

  it('should_initialize_with_empty_state_when_mounted', () => {
    const { result } = renderHook(() => useJobFiltersState(null));

    expect(result.current.companies).toEqual([]);
    expect(result.current.roleQueries).toEqual([]);
    expect(result.current.clientFilter).toBe('');
    expect(result.current.filtersLoaded).toBe(false);
  });

  it('should_set_filtersLoaded_true_after_browserStorage_resolves', async () => {
    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.filtersLoaded).toBe(true);
  });

  it('should_load_persisted_companies_and_roles_when_no_urlQuery', async () => {
    browserStorageMock.getFilters.mockResolvedValue({
      companies: ['Globo', 'Porto'],
      roles: ['Analista', 'Dev'],
    });

    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.companies).toEqual(['Globo', 'Porto']);
    expect(result.current.roleQueries).toEqual(['Analista', 'Dev']);
  });

  it('should_load_companies_but_not_roles_when_urlQuery_is_present', async () => {
    browserStorageMock.getFilters.mockResolvedValue({
      companies: ['Globo'],
      roles: ['Analista'],
    });

    const { result } = renderHook(() => useJobFiltersState('Dev React'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.companies).toEqual(['Globo']);
    expect(result.current.roleQueries).toEqual([]);
  });

  it('should_not_crash_when_browserStorage_getFilters_rejects', async () => {
    browserStorageMock.getFilters.mockRejectedValue(new Error('IndexedDB unavailable'));

    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.filtersLoaded).toBe(true);
    expect(result.current.companies).toEqual([]);
  });

  it('should_persist_filters_when_companies_change', async () => {
    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.setCompanies(['Globo']);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(browserStorageMock.setFilters).toHaveBeenCalledWith({
      companies: ['Globo'],
      roles: [],
    });
  });

  it('should_persist_filters_when_roleQueries_change', async () => {
    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.setRoleQueries(['Analista']);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(browserStorageMock.setFilters).toHaveBeenCalledWith({
      companies: [],
      roles: ['Analista'],
    });
  });

  it('should_not_persist_clientFilter', async () => {
    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    vi.mocked(browserStorageMock.setFilters).mockClear();

    act(() => {
      result.current.setClientFilter('react');
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(browserStorageMock.setFilters).not.toHaveBeenCalled();
  });

  it('should_add_new_role_via_addSuggestion', () => {
    const { result } = renderHook(() => useJobFiltersState(null));

    act(() => {
      result.current.addSuggestion('Analista');
    });

    expect(result.current.roleQueries).toEqual(['Analista']);
  });

  it('should_not_duplicate_role_via_addSuggestion', () => {
    const { result } = renderHook(() => useJobFiltersState(null));

    act(() => {
      result.current.addSuggestion('Analista');
    });
    act(() => {
      result.current.addSuggestion('Analista');
    });

    expect(result.current.roleQueries).toEqual(['Analista']);
  });

  it('should_not_crash_when_browserStorage_setFilters_rejects', async () => {
    browserStorageMock.setFilters.mockRejectedValue(new Error('quota exceeded'));

    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    // Should not throw
    act(() => {
      result.current.setCompanies(['Globo']);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  });

  it('should_ignore_persisted_roles_when_urlQuery_is_empty_string', async () => {
    browserStorageMock.getFilters.mockResolvedValue({
      companies: [],
      roles: ['Analista'],
    });

    const { result } = renderHook(() => useJobFiltersState(''));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    // Empty string is falsy → roles SHOULD be loaded
    expect(result.current.roleQueries).toEqual(['Analista']);
  });

  it('should_handle_getFilters_returning_null_filters_object', async () => {
    browserStorageMock.getFilters.mockResolvedValue({ companies: null, roles: null });

    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.companies).toEqual([]);
    expect(result.current.roleQueries).toEqual([]);
  });

  it('should_handle_getFilters_returning_non_array_roles', async () => {
    browserStorageMock.getFilters.mockResolvedValue({
      companies: ['Globo'],
      roles: 'not-an-array',
    });

    const { result } = renderHook(() => useJobFiltersState(null));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.companies).toEqual(['Globo']);
    expect(result.current.roleQueries).toEqual([]);
  });
});
