import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisClientMock = vi.hoisted(() => ({
  status: 'ready',
  get: vi.fn(),
  incrbyfloat: vi.fn(),
  expire: vi.fn(),
}));

vi.mock('@/lib/infrastructure/redis/client', () => ({
  redisClient: redisClientMock,
}));

import { getGlobalBudgetStatus, addGlobalBudgetCost } from '@/lib/infrastructure/redis/global-budget';

// O limite é lido do env no module load — a asserção deve espelhar o mesmo valor.
const EXPECTED_LIMIT = Number(process.env.GLOBAL_DAILY_BUDGET_USD ?? 0.95);

describe('getGlobalBudgetStatus (Redis mockado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisClientMock.status = 'ready';
  });

  it('retorna_uso_zero_quando_redis_nao_esta_pronto', async () => {
    redisClientMock.status = 'connecting';

    const status = await getGlobalBudgetStatus();

    expect(status.usedUsd).toBe(0);
    expect(status.limitUsd).toBe(EXPECTED_LIMIT);
    expect(status.exhausted).toBe(false);
    expect(redisClientMock.get).not.toHaveBeenCalled();
  });

  it('le_o_valor_agregado_do_dia', async () => {
    redisClientMock.get.mockResolvedValue('0.5');

    const status = await getGlobalBudgetStatus();

    expect(status.usedUsd).toBe(0.5);
    expect(status.limitUsd).toBe(EXPECTED_LIMIT);
    expect(status.ratio).toBeCloseTo(0.5 / EXPECTED_LIMIT, 2);
    expect(redisClientMock.get).toHaveBeenCalledWith(expect.stringContaining('global_budget:cost:'));
  });

  it('trata_chave_inexistente_como_zero', async () => {
    redisClientMock.get.mockResolvedValue(null);

    const status = await getGlobalBudgetStatus();

    expect(status.usedUsd).toBe(0);
  });

  it('faz_fail_open_quando_o_get_falha', async () => {
    redisClientMock.get.mockRejectedValue(new Error('redis down'));

    const status = await getGlobalBudgetStatus();

    expect(status.usedUsd).toBe(0);
    expect(status.exhausted).toBe(false);
  });
});

describe('addGlobalBudgetCost (Redis mockado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisClientMock.status = 'ready';
    redisClientMock.incrbyfloat.mockResolvedValue('0.5');
    redisClientMock.expire.mockResolvedValue(1);
  });

  it('incrementa_e_renova_ttl', async () => {
    await addGlobalBudgetCost(0.1);

    expect(redisClientMock.incrbyfloat).toHaveBeenCalledWith(
      expect.stringContaining('global_budget:cost:'),
      0.1,
    );
    expect(redisClientMock.expire).toHaveBeenCalledWith(
      expect.stringContaining('global_budget:cost:'),
      2 * 24 * 60 * 60,
    );
  });

  it('nao_incrementa_quando_redis_nao_esta_pronto', async () => {
    redisClientMock.status = 'connecting';

    await addGlobalBudgetCost(0.1);

    expect(redisClientMock.incrbyfloat).not.toHaveBeenCalled();
  });

  it('nao_incrementa_quando_valor_e_zero_ou_negativo', async () => {
    await addGlobalBudgetCost(0);
    await addGlobalBudgetCost(-0.5);

    expect(redisClientMock.incrbyfloat).not.toHaveBeenCalled();
  });

  it('ignora_falha_no_incremento', async () => {
    redisClientMock.incrbyfloat.mockRejectedValue(new Error('redis down'));

    await expect(addGlobalBudgetCost(0.1)).resolves.toBeUndefined();
  });
});
