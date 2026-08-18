import { describe, it, expect, vi, beforeEach } from 'vitest';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
const { notFound: mockNotFound } = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('next/navigation', () => ({ notFound: mockNotFound }));

import { requireAdminPage } from '@/lib/api/admin-page-guard';

describe('requireAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
  });

  it('should_call_not_found_when_no_session', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireAdminPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it('should_call_not_found_for_non_admin_role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'user' } } as any);
    await expect(requireAdminPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it('should_resolve_for_admin_role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } } as any);
    await expect(requireAdminPage()).resolves.toBeUndefined();
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});