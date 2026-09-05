import { describe, it, expect } from 'vitest';
import {
  DICA_CATALOG,
  DICA_CATEGORIES,
  allDicaSlugs,
  dicaFromSlug,
  dicasForCategory,
  type DicaCategory,
} from '@/lib/core/dicas/dica-catalog';

const CATEGORY_KEYS = Object.keys(DICA_CATEGORIES) as DicaCategory[];

describe('DICA_CATALOG', () => {
  it('should_have_unique_slugs', () => {
    const slugs = DICA_CATALOG.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('should_expose_all_required_fields_on_every_dica', () => {
    for (const dica of DICA_CATALOG) {
      expect(dica.slug.trim()).not.toBe('');
      expect(dica.title.trim()).not.toBe('');
      expect(dica.shortTitle.trim()).not.toBe('');
      expect(dica.description.trim()).not.toBe('');
      expect(dica.category).toBeDefined();
      expect(dica.publishDate).toBeDefined();
      expect(Array.isArray(dica.sections)).toBe(true);
      expect(Array.isArray(dica.faq)).toBe(true);
      expect(dica.estimatedReadingMinutes).toBeGreaterThan(0);
    }
  });

  it('should_use_only_registered_categories', () => {
    for (const dica of DICA_CATALOG) {
      expect(CATEGORY_KEYS).toContain(dica.category);
      if (dica.secondCategory) {
        expect(CATEGORY_KEYS).toContain(dica.secondCategory);
      }
    }
  });

  it('should_have_sections_with_heading_and_at_least_one_content_block', () => {
    for (const dica of DICA_CATALOG) {
      expect(dica.sections.length).toBeGreaterThan(0);
      for (const section of dica.sections) {
        expect(section.heading.trim()).not.toBe('');
        const hasContent = (section.paragraphs?.length ?? 0) > 0 || (section.list?.length ?? 0) > 0;
        expect(hasContent, `section "${section.heading}" of ${dica.slug}`).toBe(true);
      }
    }
  });

  it('should_have_faq_items_with_question_and_answer', () => {
    for (const dica of DICA_CATALOG) {
      for (const item of dica.faq) {
        expect(item.question.trim()).not.toBe('');
        expect(item.answer.trim()).not.toBe('');
      }
    }
  });

  it('should_use_iso_date_strings_for_dates', () => {
    for (const dica of DICA_CATALOG) {
      expect(dica.publishDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (dica.updateDate) {
        expect(dica.updateDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});

describe('DICA_CATEGORIES', () => {
  it('should_cover_all_four_categories_with_label_and_description', () => {
    expect(CATEGORY_KEYS.sort()).toEqual(['ats', 'carreira', 'curriculo', 'ferramenta']);
    for (const category of CATEGORY_KEYS) {
      expect(DICA_CATEGORIES[category].label.trim()).not.toBe('');
      expect(DICA_CATEGORIES[category].description.trim()).not.toBe('');
    }
  });
});

describe('allDicaSlugs', () => {
  it('should_return_every_catalog_slug_in_order', () => {
    expect(allDicaSlugs()).toEqual(DICA_CATALOG.map((d) => d.slug));
  });
});

describe('dicaFromSlug', () => {
  it('should_return_dica_for_existing_slug', () => {
    const slug = DICA_CATALOG[0].slug;
    expect(dicaFromSlug(slug)).toBe(DICA_CATALOG[0]);
  });

  it('should_return_undefined_for_unknown_slug', () => {
    expect(dicaFromSlug('slug-inexistente')).toBeUndefined();
  });
});

describe('dicasForCategory', () => {
  it('should_return_dicas_matching_primary_category', () => {
    const carreira = dicasForCategory('carreira');
    expect(carreira.length).toBeGreaterThan(0);
    for (const dica of carreira) {
      expect(dica.category).toBe('carreira');
    }
  });

  it('should_return_dicas_from_both_primary_and_second_category', () => {
    const ats = dicasForCategory('ats');
    expect(ats.length).toBeGreaterThan(0);
    for (const dica of ats) {
      expect(dica.category === 'ats' || dica.secondCategory === 'ats').toBe(true);
    }
  });

  it('should_exclude_dicas_without_the_category', () => {
    const ferramentaSlugs = dicasForCategory('ferramenta').map((d) => d.slug);
    for (const dica of DICA_CATALOG) {
      const matches =
        dica.category === 'ferramenta' || dica.secondCategory === 'ferramenta';
      expect(ferramentaSlugs.includes(dica.slug)).toBe(matches);
    }
  });
});