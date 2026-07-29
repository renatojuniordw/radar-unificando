import { describe, it, expect } from 'vitest';
import { canTransition, getStageLabel, getAllowedTransitions, InvalidStatusTransition } from '@/lib/core/application/state-machine';

describe('State Machine', () => {
  it('permite transição discovered → analyzed', () => {
    expect(canTransition('discovered', 'analyzed')).toBe(true);
  });

  it('bloqueia transição discovered → hired', () => {
    expect(canTransition('discovered', 'hired')).toBe(false);
  });

  it('retorna label em português', () => {
    expect(getStageLabel('discovered')).toBe('Descoberta');
    expect(getStageLabel('applied')).toBe('Aplicada');
  });

  it('retorna transições permitidas', () => {
    const transitions = getAllowedTransitions('applied');
    expect(transitions).toContain('recruiter_contacted');
    expect(transitions).toContain('rejected');
    expect(transitions).toContain('withdrawn');
  });

  it('hired é terminal (sem transições)', () => {
    expect(getAllowedTransitions('hired')).toHaveLength(0);
  });

  it('InvalidStatusTransition tem mensagem correta', () => {
    const err = new InvalidStatusTransition('discovered', 'hired');
    expect(err.message).toContain('discovered');
    expect(err.message).toContain('hired');
    expect(err.name).toBe('InvalidStatusTransition');
  });
});
