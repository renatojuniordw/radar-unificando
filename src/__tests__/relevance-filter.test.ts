import { describe, it, expect } from 'vitest';
import {
  isDesignSearch,
  isOffTopicPhysicalDesign,
  filterIrrelevantDesignJobs,
} from '@/lib/core/pipeline/relevance-filter';
import type { Job } from '@/types';

const mockJob = (title: string): Job => ({
  company: 'Co',
  platform: 'Gupy',
  onList: 'Não',
  roleCategory: '',
  title,
  type: 'Remoto',
  location: 'Remote',
  link: `https://gupy.io/job/${title}`,
  companyNameOnPlatform: 'Co',
  postedAt: '2024-01-01',
  alert: '',
});

describe('isDesignSearch', () => {
  it('should_return_true_for_design_queries', () => {
    expect(isDesignSearch(['Product Designer'])).toBe(true);
    expect(isDesignSearch(['UX/UI Designer'])).toBe(true);
    expect(isDesignSearch(['designer de produto'])).toBe(true);
  });

  it('should_return_false_for_non_design_queries', () => {
    expect(isDesignSearch(['data analyst'])).toBe(false);
    expect(isDesignSearch([])).toBe(false);
  });
});

describe('isOffTopicPhysicalDesign', () => {
  it('should_flag_fashion_and_industrial_titles', () => {
    expect(isOffTopicPhysicalDesign('Designer de Produto & Superfície (Estamparia)', ['designer de produto'])).toBe(true);
    expect(isOffTopicPhysicalDesign('DESIGNER II - PRODUTO/MODA', ['designer de produto'])).toBe(true);
    expect(isOffTopicPhysicalDesign('Designer Industrial de Produto', ['designer de produto'])).toBe(true);
  });

  it('should_keep_titles_without_physical_design_markers', () => {
    expect(isOffTopicPhysicalDesign('Product Designer Sênior', ['Product Designer'])).toBe(false);
    expect(isOffTopicPhysicalDesign('Coordenador(a) de Design de Produtos', ['designer de produto'])).toBe(false);
  });

  it('should_keep_jobs_when_query_explicitly_targets_the_domain', () => {
    expect(isOffTopicPhysicalDesign('Designer Industrial de Produto', ['designer industrial'])).toBe(false);
    expect(isOffTopicPhysicalDesign('Designer de Moda', ['designer de moda'])).toBe(false);
  });

  it('should_flag_marker_even_when_search_is_not_design', () => {
    // isOffTopicPhysicalDesign é a checagem pura de marcador; o gate de "busca
    // de design" fica no filterIrrelevantDesignJobs (via isDesignSearch).
    expect(isOffTopicPhysicalDesign('Designer de Moda', ['vendedor'])).toBe(true);
  });
});

describe('filterIrrelevantDesignJobs', () => {
  it('should_discard_physical_design_jobs_from_design_search', () => {
    const jobs = [
      mockJob('Product Designer Sênior'),
      mockJob('Designer de Produto & Superfície (Estamparia)'),
      mockJob('DESIGNER II - PRODUTO/MODA'),
    ];
    const result = filterIrrelevantDesignJobs(jobs, ['Product Designer', 'designer de produto']);
    expect(result.map(j => j.title)).toEqual(['Product Designer Sênior']);
  });

  it('should_keep_all_jobs_when_search_is_not_design', () => {
    const jobs = [mockJob('Designer de Moda'), mockJob('Data Analyst')];
    const result = filterIrrelevantDesignJobs(jobs, ['data analyst']);
    expect(result).toEqual(jobs);
  });

  it('should_keep_all_jobs_when_domain_is_explicitly_searched', () => {
    const jobs = [mockJob('Designer Industrial de Produto')];
    const result = filterIrrelevantDesignJobs(jobs, ['designer industrial']);
    expect(result).toEqual(jobs);
  });
});