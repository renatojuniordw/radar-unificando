import { describe, it, expect } from 'vitest';
import {
  canTransition,
  getStageLabel,
  getAllowedTransitions,
  getStageGroups,
  InvalidStatusTransition,
  STAGES,
} from '@/lib/core/application/state-machine';

describe('StateMachine', () => {
  // ── Existing Tests (Renamed from Portuguese to English) ──

  it('should_allow_transition_from_discovered_to_analyzed', () => {
    expect(canTransition('discovered', 'analyzed')).toBe(true);
  });

  it('should_block_transition_from_discovered_to_hired', () => {
    expect(canTransition('discovered', 'hired')).toBe(false);
  });

  it('should_return_portuguese_label_for_known_stages', () => {
    expect(getStageLabel('discovered')).toBe('Descoberta');
    expect(getStageLabel('applied')).toBe('Aplicada');
    expect(getStageLabel('hired')).toBe('Contratado');
    expect(getStageLabel('rejected')).toBe('Rejeitado');
  });

  it('should_return_allowed_transitions_for_applied_stage', () => {
    const transitions = getAllowedTransitions('applied');
    expect(transitions).toContain('recruiter_contacted');
    expect(transitions).toContain('rejected');
    expect(transitions).toContain('withdrawn');
    expect(transitions).toContain('no_response');
    expect(transitions).toContain('response_received');
  });

  it('should_return_empty_transitions_for_terminal_hired', () => {
    expect(getAllowedTransitions('hired')).toHaveLength(0);
  });

  it('should_return_empty_transitions_for_terminal_withdrawn', () => {
    expect(getAllowedTransitions('withdrawn')).toHaveLength(0);
  });

  it('should_have_correct_message_on_invalid_status_transition_error', () => {
    const err = new InvalidStatusTransition('discovered', 'hired');
    expect(err.message).toContain('discovered');
    expect(err.message).toContain('hired');
    expect(err.name).toBe('InvalidStatusTransition');
  });

  // ── New Tests: All Forward Transitions ──

  it('should_allow_all_valid_transitions_from_discovered', () => {
    expect(canTransition('discovered', 'analyzed')).toBe(true);
    expect(canTransition('discovered', 'withdrawn')).toBe(true);
    expect(getAllowedTransitions('discovered')).toEqual(['analyzed', 'withdrawn']);
  });

  it('should_allow_all_valid_transitions_from_analyzed', () => {
    expect(canTransition('analyzed', 'prioritized')).toBe(true);
    expect(canTransition('analyzed', 'discovered')).toBe(true);
    expect(canTransition('analyzed', 'withdrawn')).toBe(true);
  });

  it('should_allow_all_valid_transitions_from_prioritized', () => {
    expect(canTransition('prioritized', 'documents_pending')).toBe(true);
    expect(canTransition('prioritized', 'analyzed')).toBe(true);
    expect(canTransition('prioritized', 'withdrawn')).toBe(true);
  });

  it('should_allow_all_valid_transitions_from_documents_pending', () => {
    expect(canTransition('documents_pending', 'ready_to_apply')).toBe(true);
    expect(canTransition('documents_pending', 'prioritized')).toBe(true);
    expect(canTransition('documents_pending', 'withdrawn')).toBe(true);
  });

  it('should_allow_all_valid_transitions_from_ready_to_apply', () => {
    expect(canTransition('ready_to_apply', 'applied')).toBe(true);
    expect(canTransition('ready_to_apply', 'documents_pending')).toBe(true);
    expect(canTransition('ready_to_apply', 'withdrawn')).toBe(true);
  });

  it('should_allow_transition_from_rejected_to_withdrawn', () => {
    expect(canTransition('rejected', 'withdrawn')).toBe(true);
  });

  it('should_allow_transition_from_no_response_to_withdrawn', () => {
    expect(canTransition('no_response', 'withdrawn')).toBe(true);
  });

  it('should_allow_hiring_chain_from_final_stage_to_offer_to_hired', () => {
    expect(canTransition('final_stage', 'offer')).toBe(true);
    expect(canTransition('offer', 'hired')).toBe(true);
    expect(canTransition('offer', 'rejected')).toBe(true);
    expect(canTransition('offer', 'withdrawn')).toBe(true);
  });

  // ── New Tests: Invalid Transitions ──

  it('should_block_direct_transitions_across_multiple_stages', () => {
    expect(canTransition('discovered', 'hired')).toBe(false);
    expect(canTransition('discovered', 'applied')).toBe(false);
    expect(canTransition('analyzed', 'hired')).toBe(false);
    expect(canTransition('prioritized', 'hired')).toBe(false);
    expect(canTransition('applied', 'hired')).toBe(false);
  });

  it('should_return_false_for_unknown_stage_in_can_transition', () => {
    expect(canTransition('nonexistent_stage' as any, 'discovered')).toBe(false);
    expect(canTransition('discovered', 'nonexistent_stage' as any)).toBe(false);
  });

  it('should_return_empty_array_for_unknown_stage_in_get_allowed_transitions', () => {
    expect(getAllowedTransitions('nonexistent_stage' as any)).toEqual([]);
  });

  it('should_return_stage_string_fallback_for_unknown_label', () => {
    expect(getStageLabels('custom_stage' as any)).toBe('custom_stage');
  });

  // ── New Tests: getAllStages ──

  it('should_have_18_defined_stages', () => {
    expect(STAGES).toHaveLength(18);
  });

  it('should_include_all_expected_stages', () => {
    expect(STAGES).toContain('discovered');
    expect(STAGES).toContain('analyzed');
    expect(STAGES).toContain('prioritized');
    expect(STAGES).toContain('documents_pending');
    expect(STAGES).toContain('ready_to_apply');
    expect(STAGES).toContain('applied');
    expect(STAGES).toContain('recruiter_contacted');
    expect(STAGES).toContain('response_received');
    expect(STAGES).toContain('hr_interview');
    expect(STAGES).toContain('technical_interview');
    expect(STAGES).toContain('manager_interview');
    expect(STAGES).toContain('case_study');
    expect(STAGES).toContain('final_stage');
    expect(STAGES).toContain('offer');
    expect(STAGES).toContain('hired');
    expect(STAGES).toContain('rejected');
    expect(STAGES).toContain('withdrawn');
    expect(STAGES).toContain('no_response');
  });

  // ── New Tests: getStageGroups ──

  it('should_return_five_stage_groups', () => {
    const groups = getStageGroups();
    expect(Object.keys(groups)).toHaveLength(5);
    expect(groups).toHaveProperty('triagem');
    expect(groups).toHaveProperty('preparacao');
    expect(groups).toHaveProperty('aplicacao');
    expect(groups).toHaveProperty('entrevistas');
    expect(groups).toHaveProperty('resultado');
  });

  it('should_have_correct_stages_in_triagem_group', () => {
    const groups = getStageGroups();
    expect(groups.triagem).toContain('discovered');
    expect(groups.triagem).toContain('analyzed');
    expect(groups.triagem).toContain('prioritized');
  });

  it('should_have_correct_stages_in_resultado_group', () => {
    const groups = getStageGroups();
    expect(groups.resultado).toContain('offer');
    expect(groups.resultado).toContain('hired');
    expect(groups.resultado).toContain('rejected');
    expect(groups.resultado).toContain('withdrawn');
    expect(groups.resultado).toContain('no_response');
  });

  // ── New Tests: All Happy Path ──

  it('should_allow_full_happy_path_from_discovery_to_hired', () => {
    const happyPath = [
      'discovered', 'analyzed', 'prioritized', 'documents_pending',
      'ready_to_apply', 'applied', 'recruiter_contacted', 'hr_interview',
      'technical_interview', 'manager_interview', 'final_stage', 'offer', 'hired',
    ];
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(canTransition(happyPath[i], happyPath[i + 1])).toBe(true);
    }
  });

  // ── New Tests: Symmetry ──

  it('should_allow_backward_transition_from_analyzed_to_discovered', () => {
    expect(canTransition('analyzed', 'discovered')).toBe(true);
  });

  it('should_allow_backward_transition_from_prioritized_to_analyzed', () => {
    expect(canTransition('prioritized', 'analyzed')).toBe(true);
  });

  it('should_allow_backward_transition_in_interviews', () => {
    expect(canTransition('technical_interview', 'hr_interview')).toBe(true);
    expect(canTransition('manager_interview', 'technical_interview')).toBe(true);
    expect(canTransition('case_study', 'technical_interview')).toBe(true);
  });
});

// Helper for the fallback test
function getStageLabels(stage: any): string {
  return getStageLabel(stage);
}
