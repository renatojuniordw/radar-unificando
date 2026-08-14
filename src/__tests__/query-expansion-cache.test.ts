import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisClientMock = vi.hoisted(() => ({
  status: 'ready',
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('@/lib/infrastructure/redis/client', () => ({
  redisClient: redisClientMock,
}));

type CacheModule = typeof import('@/lib/core/pipeline/query-expansion/cache');
let cache: CacheModule;

// resetModules + import dinâmico: reinicia o memoryCache do módulo entre testes.
beforeEach(async () => {
  vi.clearAllMocks();
  redisClientMock.status = 'ready';
  vi.resetModules();
  cache = await import('@/lib/core/pipeline/query-expansion/cache');
});

describe('getExpansion', () => {
  it('retorna_nulo_quando_redis_nao_esta_pronto_e_memoria_vazia', async () => {
    redisClientMock.status = 'connecting';

    const result = await cache.getExpansion('analista de dados');

    expect(result).toBeNull();
    expect(redisClientMock.get).not.toHaveBeenCalled();
  });

  it('retorna_nulo_quando_chave_nao_existe_no_redis', async () => {
    redisClientMock.get.mockResolvedValue(null);

    const result = await cache.getExpansion('analista de dados');

    expect(result).toBeNull();
    expect(redisClientMock.get).toHaveBeenCalledWith(expect.stringContaining('query_expansion:'));
  });

  it('retorna_variantes_salvas_no_redis', async () => {
    redisClientMock.get.mockResolvedValue(JSON.stringify(['Data Analyst', 'Analista BI']));

    const result = await cache.getExpansion('analista de dados');

    expect(result).toEqual(['Data Analyst', 'Analista BI']);
  });

  it('usa_cache_em_memoria_quando_redis_esta_indisponivel', async () => {
    redisClientMock.status = 'connecting';
    await cache.setExpansion('analista de dados', ['Data Analyst']);

    const result = await cache.getExpansion('analista de dados');

    expect(result).toEqual(['Data Analyst']);
    expect(redisClientMock.get).not.toHaveBeenCalled();
  });

  it('faz_fail_open_quando_get_do_redis_falha', async () => {
    redisClientMock.get.mockRejectedValue(new Error('redis down'));

    const result = await cache.getExpansion('analista de dados');

    expect(result).toBeNull();
  });
});

describe('setExpansion', () => {
  it('grava_no_redis_com_ttl_de_30_dias', async () => {
    await cache.setExpansion('analista de dados', ['Data Analyst']);

    expect(redisClientMock.set).toHaveBeenCalledWith(
      expect.stringContaining('query_expansion:'),
      JSON.stringify(['Data Analyst']),
      'EX',
      30 * 24 * 60 * 60,
    );
  });

  it('faz_fail_open_quando_set_do_redis_falha_e_guarda_em_memoria', async () => {
    redisClientMock.set.mockRejectedValue(new Error('redis down'));

    await expect(cache.setExpansion('analista de dados', ['Data Analyst'])).resolves.toBeUndefined();
    expect(await cache.getExpansion('analista de dados')).toEqual(['Data Analyst']);
  });
});