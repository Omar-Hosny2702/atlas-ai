/**
 * Landing-page copy and contact details.
 * All wording is taken from existing project text (README, index.html, EmptyState, LoginScreen,
 * SettingsModal). Nothing here is a new factual claim.
 *
 * CONTACT RULES (never mix them):
 *  - SUPPORT_EMAIL  → project contact, support and updates
 *  - CREATOR_EMAIL  → Omar Hosny, the creator
 */
export const SUPPORT_EMAIL = 'atlas@omarhosny.work.gd';
export const CREATOR_EMAIL = 'contact@omarhosny.work.gd';
export const CREATOR_SITE = 'https://www.omarhosny.work.gd/';
export const CREATOR_SITE_LABEL = 'www.omarhosny.work.gd';

export const DESCRIPTION =
  'Atlas AI — a fast, private chat assistant powered by open-source language models running on your own machine.';

export const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#about', label: 'Creator' },
  { href: '#contact', label: 'Contact' },
] as const;

export const MARQUEE = [
  'Private chat assistant',
  'Open-source language models',
  'Runs on your own machine',
  'Token-by-token streaming',
  'Searchable history',
  'Markdown & code blocks',
  'Export & import',
  'Installable app',
] as const;

export const CHIPS = [
  'Token-by-token streaming',
  'Every chat stays on your own machine',
  'Searchable conversation history',
  'Open-source language models',
] as const;

export const STEPS = [
  { title: 'Log in', body: 'Sign in to access your Atlas AI conversations.' },
  { title: 'Pick or start a chat', body: 'Pick a conversation from the sidebar, or start a new one.' },
  {
    title: 'Ask anything',
    body: "Ask anything — code, writing, research, or just a question you're curious about.",
  },
] as const;

export const SUGGESTIONS = [
  'Explain how transformers work, simply',
  'Draft a polite email declining a meeting',
  'Write a Python script to rename files in bulk',
  "What's a good structure for a weekly status report?",
] as const;

export const PRESETS = ['General', 'Coding', 'Concise', 'Creative', 'Tutor'] as const;
export const MODELS = ['Llama 3.1', 'Mistral', 'Qwen 2.5', 'Gemma 2', 'Phi-3'] as const;

export const SHORTCUTS = [
  ['New chat', 'Ctrl/Cmd + K'],
  ['Focus search', 'Ctrl/Cmd + /'],
  ['Toggle sidebar', 'Ctrl/Cmd + B'],
  ['Open settings', 'Ctrl/Cmd + ,'],
  ['Close dialog', 'Esc'],
] as const;
