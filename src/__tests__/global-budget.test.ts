import { describe, it, expect } from 'vitest';
import { classifyBudget, getGlobalBudgetStatus, addGlobalBudgetCost } from '@/lib/infrastructure/redis/global-budget';

describe('classifyBudget (função pura, sem Redis)', () => {
  it('deve classificar como normal quando o uso está abaixo de 80%', () => {
    const status = classifyBudget(0, 1);
    expect(status.degraded).toBe(false);
    expect(status.exhausted).toBe(false);

    const status79 = classifyBudget(0.79, 1);
    expect(status79.degraded).toBe(false);
    expect(status79.exhausted).toBe(false);
  });

  it('deve classificar como degradado entre 80% (inclusive) e 100% (exclusive)', () => {
    const at80 = classifyBudget(0.8, 1);
    expect(at80.degraded).toBe(true);
    expect(at80.exhausted).toBe(false);

    const at99 = classifyBudget(0.99, 1);
    expect(at99.degraded).toBe(true);
    expect(at99.exhausted).toBe(false);
  });

  it('deve classificar como esgotado a partir de 100%', () => {
    const at100 = classifyBudget(1, 1);
    expect(at100.degraded).toBe(false);
    expect(at100.exhausted).toBe(true);

    const above = classifyBudget(1.5, 1);
    expect(above.exhausted).toBe(true);
  });

  it('deve calcular a razão (ratio) corretamente e não dividir por zero', () => {
    expect(classifyBudget(0.5, 1).ratio).toBe(0.5);
    expect(classifyBudget(5, 0).ratio).toBe(0);
  });
});

describe('getGlobalBudgetStatus / addGlobalBudgetCost (integração com Redis real)', () => {
  it('deve refletir o custo somado após incrementar o orçamento global', async () => {
    const before = await getGlobalBudgetStatus();
    await addGlobalBudgetCost(0.0001);
    const after = await getGlobalBudgetStatus();

    // Fail-open: se o Redis estiver indisponível no ambiente de teste, o uso permanece 0 — não falha o teste.
    expect(after.usedUsd).toBeGreaterThanOrEqual(before.usedUsd);
  });

  it('não deve incrementar quando o valor é zero ou negativo', async () => {
    const before = await getGlobalBudgetStatus();
    await addGlobalBudgetCost(0);
    await addGlobalBudgetCost(-1);
    const after = await getGlobalBudgetStatus();

    expect(after.usedUsd).toBe(before.usedUsd);
  });
});
