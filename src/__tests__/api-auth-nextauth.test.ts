import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/auth/[...nextauth]/route';

describe('NextAuth Route Handlers', () => {
  it('should_expose_get_and_post_handlers', () => {
    expect(typeof GET).toBe('function');
    expect(typeof POST).toBe('function');
  });
});