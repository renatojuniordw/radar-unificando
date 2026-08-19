import { describe, it, expect } from 'vitest';

import {
  SUGGESTED_ROLES,
  SUGGESTED_COMPANIES,
  ROTATING_WORDS,
  EXTENSION_FEATURES,
  FAQ_ITEMS,
} from '@/lib/constants/home';

describe('home constants', () => {
  it('should_expose_suggested_roles_and_companies', () => {
    expect(SUGGESTED_ROLES.length).toBeGreaterThan(0);
    expect(SUGGESTED_COMPANIES.length).toBeGreaterThan(0);
    expect(SUGGESTED_ROLES).toContain('Analista de Dados');
    expect(SUGGESTED_COMPANIES).toContain('iFood');
  });

  it('should_expose_rotating_words_and_extension_features', () => {
    expect(ROTATING_WORDS.length).toBeGreaterThan(0);
    expect(EXTENSION_FEATURES.length).toBeGreaterThan(0);
    expect(EXTENSION_FEATURES[0]).toHaveProperty('title');
    expect(EXTENSION_FEATURES[0]).toHaveProperty('desc');
  });

  it('should_expose_faq_items_with_question_and_answer', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThan(0);
    for (const item of FAQ_ITEMS) {
      expect(item.q).toBeTruthy();
      expect(item.a).toBeTruthy();
    }
  });
});