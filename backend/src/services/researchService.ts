import { GoogleGenAI } from '@google/genai';
import { AppError } from '../types/index.js';

const apiKey = process.env.GEMINI_API_KEY;

const genAI = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

const RESEARCH_MODEL = 'gemini-2.5-flash';

export interface ResearchSource {
  title: string;
  url: string;
}

export interface ResearchResult {
  answer: string;
  sources: ResearchSource[];
  searchQueries: string[];
}

export async function researchTopic(
  query: string
): Promise<ResearchResult> {
  if (!genAI) {
    throw new AppError(
      'Gemini research is not configured.',
      503
    );
  }

  try {
    const response = await genAI.models.generateContent({
      model: RESEARCH_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Research the following topic using current web information.

Give a clear, accurate answer. Prefer trustworthy primary or authoritative sources when possible.

Topic:
${query}`,
            },
          ],
        },
      ],
      config: {
        tools: [
          {
            googleSearch: {},
          },
        ],
      },
    });

    const answer =
      response.text?.trim() ||
      'Atlas Research could not produce an answer.';

    const candidate = response.candidates?.[0];

    const groundingMetadata =
      candidate?.groundingMetadata;

    const sources: ResearchSource[] = [];
    const seenUrls = new Set<string>();

    for (
      const chunk of
        groundingMetadata?.groundingChunks ?? []
    ) {
      const web = chunk.web;

      if (!web?.uri) continue;

      if (seenUrls.has(web.uri)) continue;

      seenUrls.add(web.uri);

      sources.push({
        title: web.title || web.uri,
        url: web.uri,
      });
    }

    const searchQueries =
      groundingMetadata?.webSearchQueries ?? [];

    return {
      answer,
      sources,
      searchQueries,
    };
  } catch (error) {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error
        ? Number(
            (error as { status?: unknown }).status
          )
        : undefined;

    if (status === 429) {
      throw new AppError(
        'Atlas Research is temporarily unavailable because the Gemini quota has been reached. Please try again later.',
        429
      );
    }

    if (
      status === 401 ||
      status === 403
    ) {
      throw new AppError(
        'Atlas could not authenticate with the research service.',
        502
      );
    }

    throw error;
  }
}
