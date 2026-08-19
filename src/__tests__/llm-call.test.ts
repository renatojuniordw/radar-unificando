import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

vi.mock('@/lib/core/ai/llm-provider', () => ({
  generate: vi.fn(),
}));

vi.mock('@/lib/core/ai/ai-logger', () => ({
  logAiEvent: vi.fn(),
}));

import { llmCall } from '@/lib/core/ai/shared/llm-call';
import { generate } from '@/lib/core/ai/llm-provider';
import { logAiEvent } from '@/lib/core/ai/ai-logger';

const scoreSchema = z.object({ score: z.number() });
const generateMock = vi.mocked(generate);
const logMock = vi.mocked(logAiEvent);

describe('llmCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_send_system_and_user_messages_separately', async () => {
    generateMock.mockResolvedValue({ score: 87 });
    const result = await llmCall(scoreSchema, 'You are a scorer', 'Rate this', {
      maxOutputTokens: 1000,
      eventName: 'job_analysis',
      timeoutMs: 0,
    });
    expect(result.score).toBe(87);
    expect(generateMock).toHaveBeenCalledWith(
      scoreSchema,
      { system: 'You are a scorer', user: 'Rate this' },
      { maxOutputTokens: 1000 },
    );
  });

  it('should_pass_signal_when_timeoutMs_positive', async () => {
    generateMock.mockResolvedValue({ score: 1 });
    await llmCall(scoreSchema, 'sys', 'usr', {
      maxOutputTokens: 500,
      eventName: 'job_analysis',
      timeoutMs: 5000,
    });
    const callOpts = generateMock.mock.calls[0][2] as { signal: AbortSignal };
    expect(callOpts.signal).toBeInstanceOf(AbortSignal);
  });

  it('should_log_success_with_latency', async () => {
    generateMock.mockResolvedValue({ score: 50 });
    await llmCall(scoreSchema, 'sys', 'usr', {
      maxOutputTokens: 500,
      eventName: 'ats_analysis',
      timeoutMs: 0,
      traceId: 'abc-123',
    });
    expect(logMock).toHaveBeenCalledWith('ats_analysis', expect.objectContaining({
      traceId: 'abc-123',
      success: true,
      latencyMs: expect.any(Number),
    }));
  });

  it('should_include_formatLogData_in_success_log', async () => {
    generateMock.mockResolvedValue({ score: 99 });
    await llmCall(scoreSchema, 'sys', 'usr', {
      maxOutputTokens: 500,
      eventName: 'job_analysis',
      timeoutMs: 0,
      formatLogData: (r) => ({ customScore: r.score }),
    });
    expect(logMock).toHaveBeenCalledWith('job_analysis', expect.objectContaining({
      customScore: 99,
      success: true,
    }));
  });

  it('should_include_logData_in_success_log', async () => {
    generateMock.mockResolvedValue({ score: 1 });
    await llmCall(scoreSchema, 'sys', 'usr', {
      maxOutputTokens: 500,
      eventName: 'job_analysis',
      timeoutMs: 0,
      logData: { jobTitle: 'Dev' },
    });
    expect(logMock).toHaveBeenCalledWith('job_analysis', expect.objectContaining({
      jobTitle: 'Dev',
      success: true,
    }));
  });

  it('should_log_failure_and_throw_generic_error', async () => {
    generateMock.mockRejectedValue(new Error('LLM API 500: boom'));
    await expect(
      llmCall(scoreSchema, 'sys', 'usr', {
        maxOutputTokens: 500,
        eventName: 'job_analysis',
        timeoutMs: 0,
        genericErrorMessage: 'Falhou',
      }),
    ).rejects.toThrow('Falhou');
    expect(logMock).toHaveBeenCalledWith('job_analysis', expect.objectContaining({
      success: false,
      error: 'LLM API 500: boom',
    }));
  });

  it('should_not_leak_internal_error_to_caller', async () => {
    generateMock.mockRejectedValue(new Error('secret-key-123'));
    await expect(
      llmCall(scoreSchema, 'sys', 'usr', {
        maxOutputTokens: 500,
        eventName: 'cover_letter_generation',
        timeoutMs: 0,
      }),
    ).rejects.toThrow('Não foi possível completar a operação. Tente novamente.');
  });

  it('should_not_use_timeout_wrapper_when_timeoutMs_is_zero', async () => {
    generateMock.mockResolvedValue({ score: 7 });
    const result = await llmCall(scoreSchema, 'sys', 'usr', {
      maxOutputTokens: 300,
      eventName: 'query_expansion',
      timeoutMs: 0,
    });
    expect(result.score).toBe(7);
    // Sem timeout, generate é chamado sem signal
    expect(generateMock).toHaveBeenCalledWith(
      scoreSchema,
      { system: 'sys', user: 'usr' },
      { maxOutputTokens: 300 },
    );
  });

  it('should_retry_on_timeout_and_mark_retried_in_log', async () => {
    const timeoutErr = Object.assign(new DOMException('timed out', 'TimeoutError'));
    generateMock
      .mockRejectedValueOnce(timeoutErr)
      .mockResolvedValueOnce({ score: 42 });
    const result = await llmCall(scoreSchema, 'sys', 'usr', {
      maxOutputTokens: 500,
      eventName: 'job_analysis',
      timeoutMs: 5000,
      retriesOnTimeout: 1,
    });
    expect(result.score).toBe(42);
    expect(generateMock).toHaveBeenCalledTimes(2);
    expect(logMock).toHaveBeenCalledWith('job_analysis', expect.objectContaining({
      success: true,
      retried: true,
    }));
  });

  it('should_throw_timeout_error_after_all_retries_exhausted', async () => {
    const timeoutErr = Object.assign(new DOMException('timed out', 'TimeoutError'));
    generateMock.mockRejectedValue(timeoutErr);
    await expect(
      llmCall(scoreSchema, 'sys', 'usr', {
        maxOutputTokens: 500,
        eventName: 'job_analysis',
        timeoutMs: 5000,
        retriesOnTimeout: 2,
        timeoutErrorMessage: 'Timeout total',
      }),
    ).rejects.toThrow('Timeout total');
    expect(generateMock).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should_not_retry_on_non_timeout_errors', async () => {
    generateMock.mockRejectedValue(new Error('LLM API 500'));
    await expect(
      llmCall(scoreSchema, 'sys', 'usr', {
        maxOutputTokens: 500,
        eventName: 'job_analysis',
        timeoutMs: 5000,
        retriesOnTimeout: 1,
      }),
    ).rejects.toThrow();
    expect(generateMock).toHaveBeenCalledTimes(1); // no retry
  });
});
