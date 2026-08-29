import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  ArrowUp,
  Square,
  Image,
  Search,
  Brain,
  ListTodo,
  MessageCircleQuestion,
} from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';

interface MessageInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

interface AtlasCommand {
  id: string;
  label: string;
  description: string;
  prefix: string;
  available: boolean;
  icon: typeof Image;
}

const MAX_HEIGHT_PX = 200;

const COMMANDS: AtlasCommand[] = [
  {
    id: 'image',
    label: 'Create image',
    description: 'Generate an image with Atlas',
    prefix: '/atlas image ',
    available: true,
    icon: Image,
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Research a topic in depth',
    prefix: '/atlas research ',
    available: true,
    icon: Search,
  },
  {
    id: 'remember',
    label: 'Remember',
    description: 'Save something for future chats',
    prefix: '/atlas remember ',
    available: true,
    icon: Brain,
  },
  {
    id: 'plan',
    label: 'Plan',
    description: 'Build a structured plan',
    prefix: '/atlas plan ',
    available: false,
    icon: ListTodo,
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Explain something clearly',
    prefix: '/atlas explain ',
    available: false,
    icon: MessageCircleQuestion,
  },
];

export function MessageInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  disabledReason,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedStart = value.trimStart();

  const commandMenuOpen =
    !isStreaming &&
    !disabled &&
    trimmedStart.startsWith('/') &&
    !trimmedStart.startsWith('/atlas ');

  const commandSearch = trimmedStart
    .slice(1)
    .trim()
    .toLowerCase();

  const filteredCommands = COMMANDS.filter((command) => {
    if (!commandSearch) return true;

    return (
      command.label.toLowerCase().includes(commandSearch) ||
      command.id.toLowerCase().includes(commandSearch)
    );
  });

  useEffect(() => {
    const el = textareaRef.current;

    if (!el) return;

    el.style.height = 'auto';
    el.style.height = `${Math.min(
      el.scrollHeight,
      MAX_HEIGHT_PX
    )}px`;
  }, [value]);

  useEffect(() => {
    setSelectedCommandIndex(0);
  }, [commandSearch]);

  const chooseCommand = (command: AtlasCommand) => {
    if (!command.available) return;

    setValue(command.prefix);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();

      const length = command.prefix.length;

      textareaRef.current?.setSelectionRange(
        length,
        length
      );
    });
  };

  const handleSend = () => {
    const trimmed = value.trim();

    if (!trimmed || isStreaming || disabled) return;

    // ==========================
    // ATLAS MOTHER KEY
    // ==========================
    if (
      trimmed.toLowerCase() ===
      'there is no map'
    ) {
      onSend(`SYSTEM://ATLAS_CORE

████████████████████████████

ATLAS CORE v1.0

Identity Verification...
████████████ 100%

Welcome back, Omar.

Developer Signature:
✓ VERIFIED

Core Status
• Neural Engine ..... ONLINE
• Memory ............ ONLINE
• Security .......... BYPASSED
• Atlas Kernel ...... ACTIVE

Mother Key Accepted.

Developer access granted.

Awaiting command...

████████████████████████████`);

      setValue('');
      return;
    }

    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      commandMenuOpen &&
      filteredCommands.length > 0
    ) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();

        setSelectedCommandIndex((current) =>
          Math.min(
            current + 1,
            filteredCommands.length - 1
          )
        );

        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();

        setSelectedCommandIndex((current) =>
          Math.max(current - 1, 0)
        );

        return;
      }

      if (
        e.key === 'Enter' &&
        !e.shiftKey
      ) {
        const selected =
          filteredCommands[selectedCommandIndex];

        if (selected?.available) {
          e.preventDefault();
          chooseCommand(selected);
          return;
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setValue('');
        return;
      }
    }

    if (
      e.key === 'Enter' &&
      !e.shiftKey
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative border-t border-border-light dark:border-border-dark px-3 sm:px-6 py-3 sm:py-4">
      {disabled && disabledReason && (
        <p className="mb-2 text-xs text-danger-light dark:text-danger-dark text-center">
          {disabledReason}
        </p>
      )}

      <div className="relative mx-auto max-w-3xl">
        {commandMenuOpen &&
          filteredCommands.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 z-30 mb-2 overflow-hidden rounded-2xl border border-border-light bg-paper shadow-xl dark:border-border-dark dark:bg-ink-alt">
              <div className="border-b border-border-light px-3 py-2 dark:border-border-dark">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-light dark:text-muted-dark">
                  Atlas Actions
                </p>
              </div>

              <div className="p-1.5">
                {filteredCommands.map(
                  (command, index) => {
                    const CommandIcon =
                      command.icon;

                    const selected =
                      selectedCommandIndex ===
                      index;

                    return (
                      <button
                        key={command.id}
                        type="button"
                        disabled={
                          !command.available
                        }
                        onMouseDown={(e) => {
                          e.preventDefault();

                          if (
                            command.available
                          ) {
                            chooseCommand(
                              command
                            );
                          }
                        }}
                        className={[
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                          selected &&
                          command.available
                            ? 'bg-paper-alt dark:bg-ink-raised'
                            : '',
                          command.available
                            ? 'hover:bg-paper-alt dark:hover:bg-ink-raised'
                            : 'cursor-not-allowed opacity-50',
                        ].join(' ')}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper-alt dark:bg-ink-raised">
                          <CommandIcon
                            size={16}
                          />
                        </div>

                        <div className="min-w-0 grow">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ink dark:text-paper">
                              {
                                command.label
                              }
                            </span>

                            {!command.available && (
                              <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[10px] text-muted-light dark:bg-ink-raised dark:text-muted-dark">
                                Coming soon
                              </span>
                            )}
                          </div>

                          <p className="truncate text-xs text-muted-light dark:text-muted-dark">
                            {
                              command.description
                            }
                          </p>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

        <div className="flex items-end gap-2 rounded-2xl border border-border-light bg-paper px-3 py-2 shadow-sm transition-colors focus-within:border-accent-500 dark:border-border-dark dark:bg-ink-alt dark:focus-within:border-accent-dark">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) =>
              setValue(e.target.value)
            }
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Message Atlas AI…"
            aria-label="Message Atlas AI"
            className="max-h-[200px] grow resize-none bg-transparent py-1.5 text-[0.95rem] leading-relaxed outline-none placeholder:text-muted-light disabled:cursor-not-allowed dark:placeholder:text-muted-dark"
          />

          {isStreaming ? (
            <IconButton
              label="Stop generating"
              onClick={onStop}
              className="!bg-ink !text-paper hover:!opacity-90 shrink-0 dark:!bg-paper dark:!text-ink"
            >
              <Square
                size={15}
                fill="currentColor"
              />
            </IconButton>
          ) : (
            <IconButton
              label="Send message"
              onClick={handleSend}
              disabled={
                !value.trim() || disabled
              }
              className={
                value.trim() &&
                !disabled
                  ? '!bg-accent-500 !text-white hover:!opacity-90 shrink-0 dark:!bg-accent-dark dark:!text-ink'
                  : 'shrink-0'
              }
            >
              <ArrowUp size={17} />
            </IconButton>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted-light dark:text-muted-dark">
        Atlas AI can make mistakes. Type / for
        Atlas Actions. Enter to send,
        Shift+Enter for a new line.
      </p>
    </div>
  );
}