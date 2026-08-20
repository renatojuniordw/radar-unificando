import { describe, it, expect } from 'vitest';
import * as chatTypes from '@/hooks/chat-types';

describe('chat-types', () => {
  it('should export the module without errors', () => {
    expect(chatTypes).toBeDefined();
  });

  it('should compile without errors (type-only module)', () => {
    // This test verifies that the module compiles correctly.
    // chat-types.ts only exports interfaces, which are erased at compile time.
    // The fact that this import succeeds means the types are valid.
    expect(typeof chatTypes).toBe('object');
  });
});
