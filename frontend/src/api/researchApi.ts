import { apiFetch } from './client';

export interface ResearchSource {
  title: string;
  url: string;
}

export interface ResearchResult {
  type: 'research';
  answer: string;
  sources: ResearchSource[];
  searchQueries: string[];
}

export function researchTopic(
  query: string,
  conversationId: string
): Promise<ResearchResult> {
  return apiFetch<ResearchResult>('/actions/research', {
    method: 'POST',
    body: JSON.stringify({
      query,
      conversationId,
    }),
  });
}