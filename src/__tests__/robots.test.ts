import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';
import { SITE } from '@/lib/core/constants';

type RobotRule = { userAgent: string | string[]; allow?: string; disallow?: string[] };

function flattenRules(config: ReturnType<typeof robots>): RobotRule[] {
  return (config.rules as unknown) as RobotRule[];
}

describe('robots metadata route', () => {
  it('should_define_general_rule_for_all_user_agents', () => {
    const rules = flattenRules(robots());
    expect(rules).toHaveLength(2);
    expect(rules[0].userAgent).toBe('*');
    expect(rules[0].allow).toBe('/');
  });

  it('should_disallow_sensitive_paths_for_general_bots', () => {
    const rules = flattenRules(robots());
    expect(rules[0].disallow).toEqual(['/api/', '/perfil/', '/admin/', '/export/']);
  });

  it('should_define_restricted_rule_for_ai_bots', () => {
    const rules = flattenRules(robots());
    const ai = rules[1];
    expect(ai.userAgent).toEqual([
      'GPTBot',
      'ChatGPT-User',
      'PerplexityBot',
      'ClaudeBot',
      'Google-Extended',
    ]);
    expect(ai.allow).toBe('/');
    expect(ai.disallow).toEqual(['/api/', '/perfil/', '/admin/', '/export/']);
  });

  it('should_reference_sitemap_from_site_url', () => {
    expect(robots().sitemap).toBe(`${SITE.url}/sitemap.xml`);
  });
});