import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  UploadJobStore,
  uploadJobStore,
  type UploadJobResult,
} from '@/lib/core/upload/upload-job-store';

const RESULT: UploadJobResult = {
  skills: ['Python'],
  experienceYears: 2,
  seniority: null,
  education: [],
  currentRole: null,
  area: null,
  markdown: '## x',
  resumeText: 'Python developer',
  count: 1,
};

describe('UploadJobStore', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_create_job_with_processing_status_and_timestamp', () => {
    const store = new UploadJobStore();
    const job = store.create('job-a', 'user-1');

    expect(job).toEqual({
      id: 'job-a',
      userId: 'user-1',
      status: 'processing',
      createdAt: expect.any(Number),
    });
    expect(store.findById('job-a')).toBe(job);
  });

  it('should_complete_job_setting_status_and_result', () => {
    const store = new UploadJobStore();
    store.create('job-a', 'user-1');

    const completed = store.complete('job-a', RESULT);

    expect(completed?.status).toBe('completed');
    expect(completed?.result).toEqual(RESULT);
    expect(store.findById('job-a')?.result).toEqual(RESULT);
  });

  it('should_return_null_when_completing_unknown_job', () => {
    const store = new UploadJobStore();
    expect(store.complete('missing', RESULT)).toBeNull();
  });

  it('should_fail_job_setting_status_and_error', () => {
    const store = new UploadJobStore();
    store.create('job-a', 'user-1');

    const failed = store.fail('job-a', 'erro de extração');

    expect(failed?.status).toBe('failed');
    expect(failed?.error).toBe('erro de extração');
    expect(store.findById('job-a')?.error).toBe('erro de extração');
  });

  it('should_return_null_when_failing_unknown_job', () => {
    const store = new UploadJobStore();
    expect(store.fail('missing', 'erro')).toBeNull();
  });

  it('should_return_undefined_for_unknown_job', () => {
    const store = new UploadJobStore();
    expect(store.findById('never-created')).toBeUndefined();
  });

  it('should_skip_unref_when_timer_is_not_an_object', () => {
    // Ambientes sem timers estilo Node (ex.: setInterval retorna number)
    // não possuem unref; o store deve simplesmente seguir sem chamá-lo.
    const timerSpy = vi.spyOn(globalThis, 'setInterval').mockReturnValue(123 as any);
    try {
      const store = new UploadJobStore();
      expect(() => store.create('job-a', 'user-1')).not.toThrow();
      expect(timerSpy).toHaveBeenCalled();
    } finally {
      timerSpy.mockRestore();
    }
  });

  it('should_setup_cleanup_timer_only_once', () => {
    vi.useFakeTimers();
    const store = new UploadJobStore();
    store.create('job-a', 'user-1');
    const timersAfterFirstCreate = vi.getTimerCount();
    store.create('job-b', 'user-1');
    expect(vi.getTimerCount()).toBe(timersAfterFirstCreate);
  });

  it('should_remove_jobs_older_than_ttl_during_cleanup', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const store = new UploadJobStore();
    store.create('job-old', 'user-1');

    // Avança além do TTL de 10min; o intervalo de 1min roda o cleanup
    vi.advanceTimersByTime(11 * 60 * 1000);

    expect(store.findById('job-old')).toBeUndefined();
  });

  it('should_keep_jobs_within_ttl_during_cleanup', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const store = new UploadJobStore();
    store.create('job-fresh', 'user-1');

    vi.advanceTimersByTime(1 * 60 * 1000);

    expect(store.findById('job-fresh')?.status).toBe('processing');
  });

  it('should_remove_only_expired_jobs_keeping_fresh_ones', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const store = new UploadJobStore();
    store.create('job-old', 'user-1');

    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    store.create('job-fresh', 'user-1');

    vi.advanceTimersByTime(60 * 1000);

    expect(store.findById('job-old')).toBeUndefined();
    expect(store.findById('job-fresh')).toBeDefined();
  });
});

describe('uploadJobStore singleton', () => {
  it('should_expose_a_shared_instance', () => {
    expect(uploadJobStore).toBeInstanceOf(UploadJobStore);
  });
});