import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getClientIp,
  rateLimitResponse,
  validationErrorResponse,
  routeErrorResponse,
} from '@/lib/api/route-helpers';

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    headers: {
      get: (key: string) => headers[key] ?? null,
    },
  } as any;
}

describe('getClientIp', () => {
  it('should_return_x_forwarded_for_when_present', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.50' });
    expect(getClientIp(req)).toBe('203.0.113.50');
  });

  it('should_return_x_real_ip_when_forwarded_for_absent', () => {
    const req = makeRequest({ 'x-real-ip': '198.51.100.10' });
    expect(getClientIp(req)).toBe('198.51.100.10');
  });

  it('should_return_127_0_0_1_when_no_headers_present', () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBe('127.0.0.1');
  });

  it('should_prefer_x_forwarded_for_over_x_real_ip', () => {
    const req = makeRequest({
      'x-forwarded-for': '203.0.113.50',
      'x-real-ip': '198.51.100.10',
    });
    expect(getClientIp(req)).toBe('203.0.113.50');
  });

  it('should_handle_multiple_ips_in_x_forwarded_for', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.50, 70.41.3.18' });
    // Returns full string — splitting is done by checkRateLimit internally
    expect(getClientIp(req)).toBe('203.0.113.50, 70.41.3.18');
  });
});

describe('rateLimitResponse', () => {
  it('should_return_429_with_retry_after_header', () => {
    const res = rateLimitResponse(30000);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('should_include_seconds_in_default_message', async () => {
    const res = rateLimitResponse(30000);
    const body = await res.json();
    expect(body.error).toContain('30 segundos');
  });

  it('should_use_custom_message_when_provided', async () => {
    const res = rateLimitResponse(30000, 'Custom rate limit message');
    const body = await res.json();
    expect(body.error).toBe('Custom rate limit message');
  });

  it('should_handle_zero_msBeforeNext', () => {
    const res = rateLimitResponse(0);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('0');
  });

  it('should_round_up_retry_after_seconds', () => {
    const res = rateLimitResponse(1500); // 1.5s → rounds to 2
    expect(res.headers.get('Retry-After')).toBe('2');
  });

  it('should_handle_large_msBeforeNext', async () => {
    const res = rateLimitResponse(3600000); // 1 hour
    expect(res.headers.get('Retry-After')).toBe('3600');
    const body = await res.json();
    expect(body.error).toContain('3600 segundos');
  });
});

describe('validationErrorResponse', () => {
  it('should_return_400_with_first_issue_message', async () => {
    const schema = z.object({ email: z.string().email() });
    const error = schema.safeParse({ email: 'invalid' }).error as z.ZodError;

    const res = validationErrorResponse(error);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid email address');
  });

  it('should_use_fallback_when_no_issues', async () => {
    const error = { issues: [] } as unknown as z.ZodError;

    const res = validationErrorResponse(error);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Dados inválidos');
  });

  it('should_use_custom_fallback_when_provided', async () => {
    const error = { issues: [] } as unknown as z.ZodError;

    const res = validationErrorResponse(error, 'Campos obrigatórios');
    const body = await res.json();
    expect(body.error).toBe('Campos obrigatórios');
  });

  it('should_handle_zod_error_with_multiple_issues', async () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(0),
    });
    const error = schema.safeParse({ name: '', email: 'bad', age: -1 }).error as z.ZodError;

    const res = validationErrorResponse(error);
    const body = await res.json();
    // Should return the FIRST issue's message
    expect(body.error).toBe(error.issues[0].message);
  });
});

describe('routeErrorResponse', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should_return_500_with_default_message', async () => {
    const res = routeErrorResponse(new Error('something'), 'test-route');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Erro interno');
  });

  it('should_use_custom_message_when_provided', async () => {
    const res = routeErrorResponse(new Error('something'), 'test-route', 'Custom error');
    const body = await res.json();
    expect(body.error).toBe('Custom error');
  });

  it('should_log_error_with_label', () => {
    const err = new Error('test error');
    routeErrorResponse(err, 'my-route');
    expect(consoleSpy).toHaveBeenCalledWith('[my-route] Error:', err);
  });

  it('should_handle_non_error_thrown_values', async () => {
    const res = routeErrorResponse('string error', 'test-route');
    expect(res.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalledWith('[test-route] Error:', 'string error');
  });

  it('should_handle_null_error', async () => {
    const res = routeErrorResponse(null, 'test-route');
    expect(res.status).toBe(500);
  });
});
