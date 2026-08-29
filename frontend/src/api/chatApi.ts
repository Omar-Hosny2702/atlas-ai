import {
  BASE_URL,
} from './client';

import {
  getAccessToken,
} from '@/auth/authClient';

import type {
  Message,
  StreamEvent,
} from '@/types';

export interface SendMessageInput {
  content: string;
  attachmentIds?: string[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
}

export interface StreamHandlers {
  onToken: (
    token: string
  ) => void;

  onDone: (
    message: Message
  ) => void;

  onError: (
    message: string,
    savedMessage?: Message
  ) => void;
}

async function consumeSseStream(
  response: Response,
  handlers: StreamHandlers
): Promise<void> {
  if (!response.body) {
    handlers.onError(
      'The server sent an empty response.'
    );

    return;
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = '';

  while (true) {
    const {
      value,
      done,
    } = await reader.read();

    if (done) break;

    buffer += decoder.decode(
      value,
      {
        stream: true,
      }
    );

    const events =
      buffer.split('\n\n');

    buffer =
      events.pop() ?? '';

    for (
      const rawEvent
      of events
    ) {
      const line =
        rawEvent
          .split('\n')
          .find(
            (item) =>
              item.startsWith(
                'data: '
              )
          );

      if (!line) {
        continue;
      }

      const jsonStr =
        line.slice(
          'data: '.length
        );

      let event:
        StreamEvent;

      try {
        event =
          JSON.parse(
            jsonStr
          );
      } catch {
        continue;
      }

      if (
        event.type ===
        'token'
      ) {
        handlers.onToken(
          event.token
        );
      } else if (
        event.type ===
        'done'
      ) {
        handlers.onDone(
          event.message
        );
      } else if (
        event.type ===
        'error'
      ) {
        handlers.onError(
          event.message,
          event.savedMessage
        );
      }
    }
  }
}

async function streamRequest(
  path: string,
  body: unknown,
  handlers: StreamHandlers,
  signal: AbortSignal
): Promise<void> {
  let response: Response;

  try {
    const token =
      getAccessToken();

    response =
      await fetch(
        `${BASE_URL}${path}`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },

          body:
            body ===
            undefined
              ? undefined
              : JSON.stringify(
                  body
                ),

          signal,
        }
      );
  } catch {
    if (
      signal.aborted
    ) {
      return;
    }

    handlers.onError(
      'Could not reach the Atlas AI backend. Make sure the server is running.'
    );

    return;
  }

  if (
    response.status === 401
  ) {
    handlers.onError(
      'Authentication required. Please log in again.'
    );

    return;
  }

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}.`;

    try {
      const data =
        await response.json();

      if (
        typeof data?.error ===
        'string'
      ) {
        message =
          data.error;
      }
    } catch {
      // Keep generic message.
    }

    handlers.onError(
      message
    );

    return;
  }

  try {
    await consumeSseStream(
      response,
      handlers
    );
  } catch {
    if (
      !signal.aborted
    ) {
      handlers.onError(
        'The response stream was interrupted.'
      );
    }
  }
}

export function sendMessage(
  conversationId: string,
  input: SendMessageInput,
  handlers: StreamHandlers,
  signal: AbortSignal
): Promise<void> {
  return streamRequest(
    `/chat/${conversationId}`,
    input,
    handlers,
    signal
  );
}

export function regenerateMessage(
  conversationId: string,
  handlers: StreamHandlers,
  signal: AbortSignal
): Promise<void> {
  return streamRequest(
    `/chat/${conversationId}/regenerate`,
    undefined,
    handlers,
    signal
  );
}

export async function stopGeneration(
  conversationId: string
): Promise<void> {
  try {
    const token =
      getAccessToken();

    await fetch(
      `${BASE_URL}/chat/${conversationId}/stop`,
      {
        method: 'POST',

        headers: token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {},
      }
    );
  } catch {
    /*
     * Best effort.
     * AbortController handles
     * the client immediately.
     */
  }
}