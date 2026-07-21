import type { ConversationWithMessages } from '../types/index.js';

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function toMarkdown(conversation: ConversationWithMessages): string {
  const lines: string[] = [];
  lines.push(`# ${conversation.title}`);
  lines.push('');
  lines.push(`*Exported from Atlas AI on ${formatTimestamp(new Date().toISOString())}*`);
  lines.push(`*Model: ${conversation.model}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const message of conversation.messages) {
    if (message.role === 'system') continue;
    const speaker = message.role === 'user' ? 'You' : 'Atlas AI';
    lines.push(`### ${speaker} — ${formatTimestamp(message.createdAt)}`);
    lines.push('');
    lines.push(message.content);
    lines.push('');
  }

  return lines.join('\n');
}

export function toPlainText(conversation: ConversationWithMessages): string {
  const lines: string[] = [];
  lines.push(conversation.title);
  lines.push('='.repeat(conversation.title.length));
  lines.push('');

  for (const message of conversation.messages) {
    if (message.role === 'system') continue;
    const speaker = message.role === 'user' ? 'You' : 'Atlas AI';
    lines.push(`[${formatTimestamp(message.createdAt)}] ${speaker}:`);
    lines.push(message.content);
    lines.push('');
  }

  return lines.join('\n');
}

export function toJson(conversation: ConversationWithMessages): string {
  return JSON.stringify(conversation, null, 2);
}
