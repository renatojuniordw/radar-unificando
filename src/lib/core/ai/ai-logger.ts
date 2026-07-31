export type AiEvent =
  | 'resume_extraction'
  | 'job_analysis'
  | 'resume_adaptation'
  | 'chat_interaction';

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
