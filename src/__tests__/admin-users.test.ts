import { describe, it, expect, vi, beforeEach } from 'vitest';

const { adminRepository: mockAdminRepository } = vi.hoisted(() => ({
  adminRepository: {
    listUsers: vi.fn(),
    chatUsageByUser: vi.fn(),
    pipelineRunsByUser: vi.fn(),
    jobsByUser: vi.fn(),
    courseClicksByUser: vi.fn(),
    extensionTokensByUser: vi.fn(),
  },
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  adminRepository: mockAdminRepository,
}));

import { getAdminUsers } from '@/lib/core/admin/admin-users';

describe('getAdminUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_combine_users_with_consumption', async () => {
    mockAdminRepository.listUsers.mockResolvedValue([
      { id: 'u1', email: 'a@b.com', name: 'A', role: 'admin', createdAt: new Date(), lastLoginAt: new Date() },
      { id: 'u2', email: 'c@d.com', name: null, role: 'user', createdAt: new Date(), lastLoginAt: null },
    ]);
    mockAdminRepository.chatUsageByUser.mockResolvedValue([{ userId: 'u1', tokens: 100, messages: 3 }]);
    mockAdminRepository.pipelineRunsByUser.mockResolvedValue([{ userId: 'u1', count: 5 }]);
    mockAdminRepository.jobsByUser.mockResolvedValue([{ userId: 'u1', count: 7 }]);
    mockAdminRepository.courseClicksByUser.mockResolvedValue([{ userId: 'u1', count: 2 }]);
    mockAdminRepository.extensionTokensByUser.mockResolvedValue([{ userId: 'u1', count: 4 }]);

    const result = await getAdminUsers();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'u1',
      tokens: 100,
      chatMessages: 3,
      searches: 5,
      jobs: 7,
      courseClicks: 2,
      extensionTokens: 4,
    });
    expect(result[1]).toMatchObject({
      id: 'u2',
      tokens: 0,
      chatMessages: 0,
      searches: 0,
      jobs: 0,
      courseClicks: 0,
      extensionTokens: 0,
    });
  });
});