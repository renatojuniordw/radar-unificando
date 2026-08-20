import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordFeedback } from '@/lib/core/extension/extension-feedback';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    extensionFeedback: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';

describe('recordFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call prisma.extensionFeedback.create with correct data', async () => {
    const input = {
      userId: 'user-123',
      rating: true,
      comment: 'Great extension!',
    };

    await recordFeedback(input);

    expect(prisma.extensionFeedback.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        rating: true,
        comment: 'Great extension!',
      },
    });
  });

  it('should handle false rating', async () => {
    const input = {
      userId: 'user-456',
      rating: false,
      comment: 'Not useful',
    };

    await recordFeedback(input);

    expect(prisma.extensionFeedback.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-456',
        rating: false,
        comment: 'Not useful',
      },
    });
  });

  it('should trim and limit comment to 1000 characters', async () => {
    const longComment = 'a'.repeat(1200);
    const input = {
      userId: 'user-789',
      rating: true,
      comment: longComment,
    };

    await recordFeedback(input);

    const expectedComment = 'a'.repeat(1000);
    expect(prisma.extensionFeedback.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-789',
        rating: true,
        comment: expectedComment,
      },
    });
  });

  it('should set comment to null when comment is empty string', async () => {
    const input = {
      userId: 'user-001',
      rating: true,
      comment: '',
    };

    await recordFeedback(input);

    expect(prisma.extensionFeedback.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-001',
        rating: true,
        comment: null,
      },
    });
  });

  it('should set comment to null when comment is only whitespace', async () => {
    const input = {
      userId: 'user-002',
      rating: false,
      comment: '   ',
    };

    await recordFeedback(input);

    expect(prisma.extensionFeedback.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-002',
        rating: false,
        comment: null,
      },
    });
  });

  it('should set comment to null when comment is undefined', async () => {
    const input = {
      userId: 'user-003',
      rating: true,
    };

    await recordFeedback(input);

    expect(prisma.extensionFeedback.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-003',
        rating: true,
        comment: null,
      },
    });
  });

  it('should trim whitespace from comment', async () => {
    const input = {
      userId: 'user-004',
      rating: true,
      comment: '  Nice extension!  ',
    };

    await recordFeedback(input);

    expect(prisma.extensionFeedback.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-004',
        rating: true,
        comment: 'Nice extension!',
      },
    });
  });
});
