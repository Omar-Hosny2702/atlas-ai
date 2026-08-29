import { GoogleGenAI } from '@google/genai';
import { AppError } from '../types/index.js';

const apiKey = process.env.GEMINI_API_KEY;

const genAI = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

const ACTION_MODEL = 'gemini-2.5-flash';

async function generateActionText(
  instruction: string,
  content: string
): Promise<string> {
  if (!genAI) {
    throw new AppError(
      'Atlas text actions are not configured.',
      503
    );
  }

  try {
    const response = await genAI.models.generateContent({
      model: ACTION_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${instruction}

USER REQUEST:
${content}`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.5,
      },
    });

    const text = response.text?.trim();

    if (!text) {
      throw new AppError(
        'Atlas could not generate a response.',
        502
      );
    }

    return text;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

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
        'Atlas is temporarily unavailable because the Gemini quota has been reached. Please try again later.',
        429
      );
    }

    if (status === 401 || status === 403) {
      throw new AppError(
        'Atlas could not authenticate with Gemini.',
        502
      );
    }

    throw error;
  }
}

export function explainTopic(
  topic: string
): Promise<string> {
  return generateActionText(
    `You are Atlas Explain.

Explain the topic clearly and accurately.

Rules:
- Start with the simplest useful explanation.
- Break difficult ideas into logical sections.
- Define unfamiliar terminology.
- Use examples or analogies when they genuinely help.
- Avoid unnecessary jargon.
- If the subject has equations, explain what the variables mean.
- Do not oversimplify important facts.
- Use clean Markdown formatting.`,
    topic
  );
}

export function planGoal(
  goal: string
): Promise<string> {
  return generateActionText(
    `You are Atlas Plan.

Create a practical, structured plan for the user's goal.

Rules:
- Identify the goal clearly.
- Break it into realistic stages.
- Put steps in a useful order.
- Include priorities and milestones where useful.
- Mention dependencies or likely blockers.
- Keep the plan actionable rather than motivational filler.
- Do not invent dates unless the user gave a timeframe.
- Use clear Markdown formatting.`,
    goal
  );
}