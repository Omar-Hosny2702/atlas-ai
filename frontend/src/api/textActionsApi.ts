import { apiFetch } from './client';

export interface ExplainResult {
  type: 'explain';
  answer: string;
}

export interface PlanResult {
  type: 'plan';
  answer: string;
}

export function explainTopic(
  topic: string,
  conversationId: string
): Promise<ExplainResult> {
  return apiFetch<ExplainResult>('/actions/explain', {
    method: 'POST',
    body: JSON.stringify({
      topic,
      conversationId,
    }),
  });
}

export function planGoal(
  goal: string,
  conversationId: string
): Promise<PlanResult> {
  return apiFetch<PlanResult>('/actions/plan', {
    method: 'POST',
    body: JSON.stringify({
      goal,
      conversationId,
    }),
  });
}