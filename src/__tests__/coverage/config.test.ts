import { describe, it, expect } from 'vitest';
import { config } from '@/config';

describe('Config', () => {
  it('should_have_port_11010', () => {
    expect(config.port).toBe(11010);
  });

  it('should_have_gupy_config', () => {
    expect(config.gupy.apiUrl).toContain('gupy.io');
    expect(config.gupy.queries.length).toBeGreaterThan(0);
    expect(config.gupy.maxOffset).toBe(3000);
  });

  it('should_have_inhire_config', () => {
    expect(config.inhire.apiUrl).toContain('inhire.app');
    expect(config.inhire.concurrency).toBe(16);
  });

  it('should_have_discovery_config', () => {
    expect(config.discovery.enabledByDefault).toBe(true);
    expect(config.discovery.wayback.url).toContain('web.archive.org');
  });

  it('should_have_pipeline_config', () => {
    expect(config.pipeline.maxRunTime).toBe(600_000);
    expect(config.pipeline.progressInterval).toBe(500);
  });

  it('should_have_all_sections', () => {
    expect(config).toHaveProperty('gupy');
    expect(config).toHaveProperty('inhire');
    expect(config).toHaveProperty('discovery');
    expect(config).toHaveProperty('pipeline');
  });
});
