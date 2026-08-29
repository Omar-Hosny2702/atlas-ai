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
  topic: string
): Promise<ExplainResult> {
  return apiFetch<ExplainResult>('/actions/explain', {
    method: 'POST',
    body: JSON.stringify({ topic }),
  });
}

export function planGoal(
  goal: string
): Promise<PlanResult> {
  return apiFetch<PlanResult>('/actions/plan', {
    method: 'POST',
    body: JSON.stringify({ goal }),
  });
}