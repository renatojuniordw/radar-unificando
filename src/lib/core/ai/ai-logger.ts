export type AiEvent =
  | 'resume_extraction'
  | 'job_analysis'
  | 'resume_adaptation'
  | 'chat_interaction'
  | 'suspicious_activity'
  | 'cover_letter_generation'
  | 'interview_questions_generation'
  | 'ats_analysis'
  | 'ats_rewrite';

export function logAiEvent(
  event: AiEvent,
  data: Record<string, unknown>,
) {
  console.log('[AI_LOG]', JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}
