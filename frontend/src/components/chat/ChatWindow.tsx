import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';

import {
  File,
  Image as ImageIcon,
  Loader2,
  Menu,
  Settings2,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';

import {
  useChat,
} from '@/hooks/useChat';

import {
  useConversations,
} from '@/context/ConversationContext';

import {
  useToast,
} from '@/context/ToastContext';

import {
  MessageList,
} from './MessageList';

import {
  MessageInput,
} from './MessageInput';

import {
  IconButton,
} from '@/components/common/IconButton';

import {
  Logo,
} from '@/components/common/Logo';

import {
  ConversationSettingsModal,
} from '@/components/settings/ConversationSettingsModal';

import {
  generateImage,
} from '@/api/actionsApi';

import {
  researchTopic,
} from '@/api/researchApi';

import {
  explainTopic,
  planGoal,
} from '@/api/textActionsApi';

import {
  addMemory,
} from '@/api/settingsApi';

import {
  uploadAttachment,
  type AttachmentKind,
} from '@/api/attachmentsApi';

import type {
  Message,
} from '@/types';

import {
  useAuth,
} from '@/auth/AuthContext';

interface ChatWindowProps {
  conversationId:
    string | null;

  onOpenSidebar:
    () => void;
}

interface PendingAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: AttachmentKind;
  url: string;
  pathname: string;

  /*
   * Local browser preview.
   * We don't use the private Blob URL
   * directly because that returns 403.
   */
  previewUrl?:
    string;
}

interface UploadProgressState {
  fileName: string;
  percentage: number;
  kind: AttachmentKind;
}

const MAX_ATTACHMENT_SIZE =
  20 * 1024 * 1024;

const MAX_ATTACHMENTS =
  10;

const ALLOWED_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);

function formatFileSize(
  bytes: number
): string {
  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes / 1024;

  if (
    kilobytes < 1024
  ) {
    return `${kilobytes.toFixed(
      kilobytes >= 100
        ? 0
        : 1
    )} KB`;
  }

  const megabytes =
    kilobytes / 1024;

  return `${megabytes.toFixed(
    megabytes >= 10
      ? 1
      : 2
  )} MB`;
}

function revokePreview(
  attachment:
    PendingAttachment
): void {
  if (
    attachment.previewUrl
  ) {
    URL.revokeObjectURL(
      attachment.previewUrl
    );
  }
}

export function ChatWindow({
  conversationId,
  onOpenSidebar,
}: ChatWindowProps) {
  const {
    refreshList,
    createNewConversation,
    selectConversation,
  } =
    useConversations();

  const {
    showToast,
  } =
    useToast();

  const {
  session,
} =
  useAuth();

const displayName =
  session?.user?.name ||
  session?.user?.email?.split('@')[0] ||
  'there';

const firstName =
  displayName
    .trim()
    .split(/\s+/)[0] ||
  'there';

  const [
    conversationSettingsOpen,
    setConversationSettingsOpen,
  ] =
    useState(false);

  const [
    actionMessages,
    setActionMessages,
  ] =
    useState<
      Message[]
    >([]);

  const [
    isRunningAction,
    setIsRunningAction,
  ] =
    useState(false);

  const [
    pendingAttachments,
    setPendingAttachments,
  ] =
    useState<
      PendingAttachment[]
    >([]);

  const [
    uploadProgress,
    setUploadProgress,
  ] =
    useState<
      UploadProgressState | null
    >(null);

  const [
    isDraggingFiles,
    setIsDraggingFiles,
  ] =
    useState(false);

  /*
   * dragenter / dragleave fire whenever
   * the pointer crosses child elements.
   * Counting depth prevents the overlay
   * from flickering.
   */
  const dragDepthRef =
    useRef(0);

  const pendingAttachmentsRef =
    useRef<
      PendingAttachment[]
    >([]);

  const {
    conversation,
    messages,
    loading,
    loadError,
    isStreaming,
    streamError,
    send,
    stop,
    regenerate,
    reload,
  } =
    useChat(
      conversationId,
      refreshList
    );

  useEffect(
    () => {
      pendingAttachmentsRef.current =
        pendingAttachments;
    },
    [
      pendingAttachments,
    ]
  );

  /*
   * Clear local previews when switching
   * conversations or unmounting.
   */
  useEffect(
    () => {
      return () => {
        for (
          const attachment
          of pendingAttachmentsRef.current
        ) {
          revokePreview(
            attachment
          );
        }
      };
    },
    [
      conversationId,
    ]
  );

  useEffect(
    () => {
      setActionMessages(
        []
      );

      setPendingAttachments(
        []
      );

      setUploadProgress(
        null
      );

      setIsDraggingFiles(
        false
      );

      dragDepthRef.current =
        0;
    },
    [
      conversationId,
    ]
  );

  useEffect(
    () => {
      if (
        streamError
      ) {
        showToast(
          streamError,
          'error'
        );
      }
    },
    [
      streamError,
      showToast,
    ]
  );

  const createActionMessages =
    (
      originalContent:
        string,
      loadingText:
        string
    ) => {
      if (
        !conversationId
      ) {
        return null;
      }

      const userMessage:
        Message = {
          id:
            crypto.randomUUID(),

          conversationId,

          role:
            'user',

          content:
            originalContent,

          createdAt:
            new Date()
              .toISOString(),
        };

      const assistantId =
        crypto.randomUUID();

      const assistantMessage:
        Message = {
          id:
            assistantId,

          conversationId,

          role:
            'assistant',

          content:
            loadingText,

          createdAt:
            new Date()
              .toISOString(),
        };

      setActionMessages(
        (current) => [
          ...current,
          userMessage,
          assistantMessage,
        ]
      );

      return assistantId;
    };

  const setActionError =
    (
      assistantId:
        string,
      error:
        unknown,
      fallback:
        string
    ) => {
      const message =
        error instanceof
        Error
          ? error.message
          : fallback;

      setActionMessages(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              assistantId
                ? {
                    ...item,
                    content:
                      '',
                    error:
                      message,
                  }
                : item
          )
      );

      showToast(
        message,
        'error'
      );
    };

  const runImageAction =
    async (
      originalContent:
        string,
      prompt:
        string
    ) => {
      if (
        !conversationId ||
        isRunningAction
      ) {
        return;
      }

      const assistantId =
        createActionMessages(
          originalContent,
          'Generating image…'
        );

      if (
        !assistantId
      ) {
        return;
      }

      setIsRunningAction(
        true
      );

      try {
        const result =
          await generateImage(
            prompt
          );

        setActionMessages(
          (current) =>
            current.map(
              (message) =>
                message.id ===
                assistantId
                  ? {
                      ...message,

                      content:
                        '',

                      image: {
                        mimeType:
                          result.mimeType,

                        data:
                          result.data,

                        alt:
                          prompt,
                      },
                    }
                  : message
            )
        );
      } catch (
        error
      ) {
        setActionError(
          assistantId,
          error,
          'Image generation failed.'
        );
      } finally {
        setIsRunningAction(
          false
        );
      }
    };

  const runResearchAction =
    async (
      originalContent:
        string,
      query:
        string
    ) => {
      if (
        !conversationId ||
        isRunningAction
      ) {
        return;
      }

      const assistantId =
        createActionMessages(
          originalContent,
          'Searching the web and analysing sources…'
        );

      if (
        !assistantId
      ) {
        return;
      }

      setIsRunningAction(
        true
      );

      try {
        await researchTopic(
          query,
          conversationId
        );

        await reload();

        await refreshList();

        setActionMessages(
          []
        );
      } catch (
        error
      ) {
        setActionError(
          assistantId,
          error,
          'Research failed.'
        );
      } finally {
        setIsRunningAction(
          false
        );
      }
    };

  const runExplainAction =
    async (
      originalContent:
        string,
      topic:
        string
    ) => {
      if (
        !conversationId ||
        isRunningAction
      ) {
        return;
      }

      const assistantId =
        createActionMessages(
          originalContent,
          'Building a clear explanation…'
        );

      if (
        !assistantId
      ) {
        return;
      }

      setIsRunningAction(
        true
      );

      try {
        await explainTopic(
          topic,
          conversationId
        );

        await reload();

        await refreshList();

        setActionMessages(
          []
        );
      } catch (
        error
      ) {
        setActionError(
          assistantId,
          error,
          'Explanation failed.'
        );
      } finally {
        setIsRunningAction(
          false
        );
      }
    };

  const runPlanAction =
    async (
      originalContent:
        string,
      goal:
        string
    ) => {
      if (
        !conversationId ||
        isRunningAction
      ) {
        return;
      }

      const assistantId =
        createActionMessages(
          originalContent,
          'Building your plan…'
        );

      if (
        !assistantId
      ) {
        return;
      }

      setIsRunningAction(
        true
      );

      try {
        await planGoal(
          goal,
          conversationId
        );

        await reload();

        await refreshList();

        setActionMessages(
          []
        );
      } catch (
        error
      ) {
        setActionError(
          assistantId,
          error,
          'Planning failed.'
        );
      } finally {
        setIsRunningAction(
          false
        );
      }
    };

  const runRememberAction =
    async (
      originalContent:
        string,
      memory:
        string
    ) => {
      if (
        !conversationId ||
        isRunningAction
      ) {
        return;
      }

      const assistantId =
        createActionMessages(
          originalContent,
          'Saving to memory…'
        );

      if (
        !assistantId
      ) {
        return;
      }

      setIsRunningAction(
        true
      );

      try {
        await addMemory(
          memory,
          'general'
        );

        setActionMessages(
          (current) =>
            current.map(
              (message) =>
                message.id ===
                assistantId
                  ? {
                      ...message,

                      content:
                        `✓ Saved to memory: **${memory}**`,
                    }
                  : message
            )
        );

        showToast(
          'Saved to Atlas memory.',
          'success'
        );
      } catch (
        error
      ) {
        setActionError(
          assistantId,
          error,
          'Could not save memory.'
        );
      } finally {
        setIsRunningAction(
          false
        );
      }
    };

  const uploadSelectedFile =
    async (
      file:
        File,
      kind:
        AttachmentKind
    ) => {
      if (
        !conversationId
      ) {
        showToast(
          'Open a conversation before adding an attachment.',
          'error'
        );

        return false;
      }

      if (
        pendingAttachmentsRef
          .current
          .length >=
        MAX_ATTACHMENTS
      ) {
        showToast(
          `You can attach up to ${MAX_ATTACHMENTS} files to one message.`,
          'error'
        );

        return false;
      }

      if (
        file.size >
        MAX_ATTACHMENT_SIZE
      ) {
        showToast(
          'Files must be 20 MB or smaller.',
          'error'
        );

        return false;
      }

      if (
        file.size <=
        0
      ) {
        showToast(
          'That file is empty.',
          'error'
        );

        return false;
      }

      setUploadProgress({
        fileName:
          file.name,

        percentage:
          0,

        kind,
      });

      try {
        const uploaded =
          await uploadAttachment({
            file,
            conversationId,
            kind,

            onProgress:
              (
                percentage
              ) => {
                setUploadProgress(
                  (
                    current
                  ) =>
                    current
                      ? {
                          ...current,

                          percentage:
                            Math.max(
                              0,
                              Math.min(
                                100,
                                percentage
                              )
                            ),
                        }
                      : current
                );
              },
          });

        const previewUrl =
          file.type
            .toLowerCase()
            .startsWith(
              'image/'
            )
            ? URL.createObjectURL(
                file
              )
            : undefined;

        const attachment:
          PendingAttachment = {
            id:
              uploaded.attachmentId,

            fileName:
              file.name,

            mimeType:
              file.type ||
              'application/octet-stream',

            sizeBytes:
              file.size,

            kind,

            url:
              uploaded.url,

            pathname:
              uploaded.pathname,

            previewUrl,
          };

        setPendingAttachments(
          (current) => {
            const next = [
              ...current,
              attachment,
            ];

            pendingAttachmentsRef.current =
              next;

            return next;
          }
        );

        showToast(
          `${file.name} uploaded.`,
          'success'
        );

        return true;
      } catch (
        error
      ) {
        const message =
          error instanceof
          Error
            ? error.message
            : 'Attachment upload failed.';

        showToast(
          message,
          'error'
        );

        return false;
      } finally {
        setUploadProgress(
          null
        );
      }
    };

  const handleAttachImage =
    async (
      file:
        File
    ) => {
      if (
        !ALLOWED_IMAGE_TYPES.has(
          file.type
        )
      ) {
        showToast(
          'Please choose a PNG, JPEG, WebP, or GIF image.',
          'error'
        );

        return;
      }

      await uploadSelectedFile(
        file,
        'image'
      );
    };

  const handleAttachFile =
    async (
      file:
        File
    ) => {
      await uploadSelectedFile(
        file,
        'file'
      );
    };

  const handleRemoveAttachment =
    (
      id:
        string
    ) => {
      setPendingAttachments(
        (current) => {
          const removed =
            current.find(
              (
                attachment
              ) =>
                attachment.id ===
                id
            );

          if (
            removed
          ) {
            revokePreview(
              removed
            );
          }

          const next =
            current.filter(
              (
                attachment
              ) =>
                attachment.id !==
                id
            );

          pendingAttachmentsRef.current =
            next;

          return next;
        }
      );
    };

  /*
   * DRAG + DROP
   */
  const handleDragEnter =
    (
      event:
        DragEvent<HTMLDivElement>
    ) => {
      if (
        !event.dataTransfer
          .types
          .includes(
            'Files'
          )
      ) {
        return;
      }

      event.preventDefault();

      dragDepthRef.current +=
        1;

      setIsDraggingFiles(
        true
      );
    };

  const handleDragOver =
    (
      event:
        DragEvent<HTMLDivElement>
    ) => {
      if (
        !event.dataTransfer
          .types
          .includes(
            'Files'
          )
      ) {
        return;
      }

      event.preventDefault();

      event.dataTransfer.dropEffect =
        'copy';

      if (
        !isDraggingFiles
      ) {
        setIsDraggingFiles(
          true
        );
      }
    };

  const handleDragLeave =
    (
      event:
        DragEvent<HTMLDivElement>
    ) => {
      event.preventDefault();

      dragDepthRef.current =
        Math.max(
          0,
          dragDepthRef.current -
            1
        );

      if (
        dragDepthRef.current ===
        0
      ) {
        setIsDraggingFiles(
          false
        );
      }
    };

  const handleDrop =
    async (
      event:
        DragEvent<HTMLDivElement>
    ) => {
      event.preventDefault();

      dragDepthRef.current =
        0;

      setIsDraggingFiles(
        false
      );

      if (
        !conversationId
      ) {
        showToast(
          'Open a conversation before dropping files.',
          'error'
        );

        return;
      }

      if (
        isStreaming ||
        isRunningAction ||
        uploadProgress
      ) {
        showToast(
          'Wait for Atlas to finish before adding files.',
          'error'
        );

        return;
      }

      const files =
        Array.from(
          event.dataTransfer
            .files
        );

      if (
        files.length ===
        0
      ) {
        return;
      }

      const remainingSlots =
        Math.max(
          0,
          MAX_ATTACHMENTS -
            pendingAttachmentsRef
              .current
              .length
        );

      if (
        remainingSlots ===
        0
      ) {
        showToast(
          `You can attach up to ${MAX_ATTACHMENTS} files to one message.`,
          'error'
        );

        return;
      }

      const acceptedFiles =
        files.slice(
          0,
          remainingSlots
        );

      if (
        acceptedFiles.length <
        files.length
      ) {
        showToast(
          `Only ${remainingSlots} more attachment${remainingSlots === 1 ? '' : 's'} can be added.`,
          'error'
        );
      }

      /*
       * Upload sequentially.
       *
       * This keeps the existing single
       * progress UI reliable and prevents
       * several simultaneous Blob uploads
       * from fighting over the same state.
       */
      for (
        const file
        of acceptedFiles
      ) {
        const isImage =
          ALLOWED_IMAGE_TYPES.has(
            file.type
          );

        await uploadSelectedFile(
          file,
          isImage
            ? 'image'
            : 'file'
        );
      }
    };

  const handleImport =
    async (
      file:
        File
    ) => {
      if (
        file.type !==
          'application/json' &&
        !file.name
          .toLowerCase()
          .endsWith(
            '.json'
          )
      ) {
        showToast(
          'Import currently accepts JSON files only.',
          'error'
        );

        return;
      }

      try {
        const text =
          await file.text();

        JSON.parse(
          text
        );

        showToast(
          `${file.name} is valid JSON. Import mapping is the next step.`,
          'success'
        );
      } catch {
        showToast(
          'That file is not valid JSON.',
          'error'
        );
      }
    };

  const handleExport =
    () => {
      if (
        !conversation
      ) {
        showToast(
          'Open a conversation before exporting.',
          'error'
        );

        return;
      }

      const payload = {
        exportedAt:
          new Date()
            .toISOString(),

        conversation,

        messages,
      };

      const blob =
        new Blob(
          [
            JSON.stringify(
              payload,
              null,
              2
            ),
          ],
          {
            type:
              'application/json',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          'a'
        );

      const safeTitle =
        conversation.title
          .trim()
          .replace(
            /[^a-z0-9-_]+/gi,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          )
          .toLowerCase() ||
        'atlas-chat';

      anchor.href =
        url;

      anchor.download =
        `${safeTitle}.json`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        url
      );

      showToast(
        'Conversation exported.',
        'success'
      );
    };

  const handleSend =
    (
      content:
        string
    ) => {
      const rememberMatch =
        content.match(
          /^\/atlas\s+remember\s+(.+)$/i
        );

      if (
        rememberMatch
      ) {
        const memory =
          rememberMatch[
            1
          ].trim();

        if (
          !memory ||
          !conversationId
        ) {
          return;
        }

        void runRememberAction(
          content,
          memory
        );

        return;
      }

      const imageMatch =
        content.match(
          /^\/atlas\s+image\s+(.+)$/i
        );

      if (
        imageMatch
      ) {
        const prompt =
          imageMatch[
            1
          ].trim();

        if (
          !prompt ||
          !conversationId
        ) {
          return;
        }

        void runImageAction(
          content,
          prompt
        );

        return;
      }

      const researchMatch =
        content.match(
          /^\/atlas\s+research\s+(.+)$/i
        );

      if (
        researchMatch
      ) {
        const query =
          researchMatch[
            1
          ].trim();

        if (
          !query ||
          !conversationId
        ) {
          return;
        }

        void runResearchAction(
          content,
          query
        );

        return;
      }

      const explainMatch =
        content.match(
          /^\/atlas\s+explain\s+(.+)$/i
        );

      if (
        explainMatch
      ) {
        const topic =
          explainMatch[
            1
          ].trim();

        if (
          !topic ||
          !conversationId
        ) {
          return;
        }

        void runExplainAction(
          content,
          topic
        );

        return;
      }

      const planMatch =
        content.match(
          /^\/atlas\s+plan\s+(.+)$/i
        );

      if (
        planMatch
      ) {
        const goal =
          planMatch[
            1
          ].trim();

        if (
          !goal ||
          !conversationId
        ) {
          return;
        }

        void runPlanAction(
          content,
          goal
        );

        return;
      }

      const attachments =
        pendingAttachments.map(
          (
            attachment
          ) => ({
            id:
              attachment.id,

            fileName:
              attachment.fileName,

            mimeType:
              attachment.mimeType,

            sizeBytes:
              attachment.sizeBytes,

            kind:
              attachment.kind,

            storageUrl:
              attachment.url,
          })
        );

      /*
       * Attachment-only messages now reach
       * useChat with an empty content string.
       */
      void send(
        content,
        attachments
      ).then(
        () => {
          for (
            const attachment
            of pendingAttachments
          ) {
            revokePreview(
              attachment
            );
          }

          pendingAttachmentsRef.current =
            [];

          setPendingAttachments(
            []
          );
        }
      );
    };

  const handleNewChat =
    async () => {
      const id =
        await createNewConversation();

      if (
        id
      ) {
        selectConversation(
          id
        );
      }
    };

  if (
    !conversationId
  ) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-paper dark:bg-[#090b10]">
        <header
          className="
            flex h-14 shrink-0
            items-center justify-between
            border-b border-black/[0.06]
            px-3
            dark:border-white/[0.07]
            sm:px-5
          "
        >
          <div className="flex items-center gap-2">
            <IconButton
              label="Open sidebar"
              onClick={
                onOpenSidebar
              }
              className="md:hidden"
            >
              <Menu
                size={
                  18
                }
              />
            </IconButton>

            <span className="text-sm font-medium text-muted-light dark:text-muted-dark">
              Atlas AI
            </span>
          </div>
        </header>

        <div className="flex grow items-center justify-center px-6 pb-24">
          <div className="flex max-w-xl flex-col items-center text-center">
            <div
              className="
                mb-5 flex h-16 w-16
                items-center justify-center
                rounded-2xl
                border border-black/[0.06]
                bg-black/[0.03]
                shadow-sm
                dark:border-white/10
                dark:bg-white/[0.05]
              "
            >
              <Logo
                size={
                  40
                }
              />
            </div>

            <h1
              className="
                font-display
                text-3xl
                font-semibold
                tracking-tight
                text-ink
                dark:text-paper
                sm:text-4xl
              "
            >
              Hi Omar,
              what&apos;s the
              plan?
            </h1>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-light dark:text-muted-dark">
              Ask Atlas
              anything, research
              a topic, create an
              image, or start
              with an Atlas
              Action.
            </p>

            <button
              type="button"
              onClick={
                handleNewChat
              }
              className="
                mt-7 inline-flex
                items-center gap-2
                rounded-full
                border
                border-black/10
                bg-white
                px-4 py-2.5
                text-sm
                font-medium
                text-ink
                shadow-sm
                transition
                hover:bg-black/[0.03]
                dark:border-white/10
                dark:bg-white/[0.05]
                dark:text-paper
                dark:hover:bg-white/[0.08]
              "
            >
              <Sparkles
                size={
                  16
                }
                className="text-accent-500"
              />

              Start a new
              chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (
    loadError
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-danger-light dark:text-danger-dark">
          {
            loadError
          }
        </p>
      </div>
    );
  }

  const visibleMessages = [
    ...messages,
    ...actionMessages,
  ];

  const hasMessages =
    visibleMessages.filter(
      (message) =>
        message.role !==
        'system'
    ).length >
    0;

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-paper dark:bg-[#090b10]"
      onDragEnter={
        handleDragEnter
      }
      onDragOver={
        handleDragOver
      }
      onDragLeave={
        handleDragLeave
      }
      onDrop={
        handleDrop
      }
    >
      {isDraggingFiles && (
        <div
          className="
            pointer-events-none
            absolute inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/20
            p-6
            backdrop-blur-[2px]
            dark:bg-black/45
          "
        >
          <div
            className="
              flex
              max-w-sm
              flex-col
              items-center
              rounded-3xl
              border
              border-accent-500/40
              bg-white/95
              px-8
              py-7
              text-center
              shadow-2xl
              dark:bg-[#12151c]/95
            "
          >
            <div
              className="
                flex h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-accent-500/10
                text-accent-500
              "
            >
              <UploadCloud
                size={
                  27
                }
              />
            </div>

            <p className="mt-4 text-base font-semibold text-ink dark:text-paper">
              Drop files to
              attach
            </p>

            <p className="mt-1 text-xs text-muted-light dark:text-muted-dark">
              Images and files
              up to 20 MB
            </p>
          </div>
        </div>
      )}

      <header
        className="
          flex h-14 shrink-0
          items-center
          justify-between
          gap-3
          border-b
          border-black/[0.06]
          px-3
          dark:border-white/[0.07]
          sm:px-5
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            label="Open sidebar"
            onClick={
              onOpenSidebar
            }
            className="md:hidden"
          >
            <Menu
              size={
                18
              }
            />
          </IconButton>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-ink dark:text-paper">
              {loading
                ? 'Loading…'
                : conversation
                    ?.title ??
                  'New chat'}
            </h2>

            {conversation && (
              <p className="truncate text-[10px] text-muted-light dark:text-muted-dark">
                {
                  conversation.model
                }
              </p>
            )}
          </div>
        </div>

        <IconButton
          label="Conversation settings"
          onClick={() =>
            setConversationSettingsOpen(
              true
            )
          }
          disabled={
            !conversation
          }
        >
          <Settings2
            size={
              17
            }
          />
        </IconButton>
      </header>

      <div className="relative flex min-h-0 grow flex-col">
        {!loading &&
        !hasMessages ? (
          <div className="flex grow items-center justify-center px-6 pb-10">
            <div className="flex max-w-xl flex-col items-center text-center">
              <div
                className="
                  mb-5 flex h-16 w-16
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-black/[0.06]
                  bg-black/[0.03]
                  shadow-sm
                  dark:border-white/10
                  dark:bg-white/[0.05]
                "
              >
                <Logo
                  size={
                    40
                  }
                />
              </div>

              <h1
                className="
                  font-display
                  text-3xl
                  font-semibold
                  tracking-tight
                  text-ink
                  dark:text-paper
                  sm:text-4xl
                "
              >
                Hi Omar,
                what&apos;s the
                plan?
              </h1>

              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-light dark:text-muted-dark">
                Message Atlas
                below or type

                <span className="mx-1 font-medium text-ink dark:text-paper">
                  /
                </span>

                to use Atlas
                Actions.
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 grow">
            <MessageList
              messages={
                visibleMessages
              }
              isStreaming={
                isStreaming ||
                isRunningAction
              }
              onRegenerate={
                regenerate
              }
            />
          </div>
        )}

        <div className="shrink-0">
          <div className="mx-auto w-full max-w-3xl px-3 sm:px-4">
            {uploadProgress && (
              <div
                className="
                  mb-2
                  overflow-hidden
                  rounded-2xl
                  border
                  border-black/[0.08]
                  bg-white
                  p-3
                  shadow-sm
                  dark:border-white/10
                  dark:bg-white/[0.05]
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-10 w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-black/[0.04]
                      dark:bg-white/[0.06]
                    "
                  >
                    {uploadProgress.kind ===
                    'image' ? (
                      <ImageIcon
                        size={
                          18
                        }
                      />
                    ) : (
                      <File
                        size={
                          18
                        }
                      />
                    )}
                  </div>

                  <div className="min-w-0 grow">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-medium text-ink dark:text-paper">
                        {
                          uploadProgress.fileName
                        }
                      </p>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <Loader2
                          size={
                            13
                          }
                          className="animate-spin"
                        />

                        <span className="text-[11px] text-muted-light dark:text-muted-dark">
                          {Math.round(
                            uploadProgress.percentage
                          )}
                          %
                        </span>
                      </div>
                    </div>

                    <div
                      className="
                        mt-2 h-1.5
                        overflow-hidden
                        rounded-full
                        bg-black/[0.06]
                        dark:bg-white/[0.08]
                      "
                    >
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-accent-500
                          transition-[width]
                          duration-200
                        "
                        style={{
                          width:
                            `${uploadProgress.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pendingAttachments.length >
              0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {pendingAttachments.map(
                  (
                    attachment
                  ) => {
                    const isImage =
                      attachment.mimeType
                        .toLowerCase()
                        .startsWith(
                          'image/'
                        );

                    return (
                      <div
                        key={
                          attachment.id
                        }
                        className="
                          relative
                          shrink-0
                          overflow-hidden
                          rounded-2xl
                          border
                          border-black/[0.08]
                          bg-white
                          shadow-sm
                          dark:border-white/10
                          dark:bg-white/[0.05]
                        "
                      >
                        {isImage &&
                        attachment.previewUrl ? (
                          <div className="relative h-24 w-28">
                            <img
                              src={
                                attachment.previewUrl
                              }
                              alt={
                                attachment.fileName
                              }
                              className="h-full w-full object-cover"
                            />

                            <button
                              type="button"
                              aria-label={`Remove ${attachment.fileName}`}
                              onClick={() =>
                                handleRemoveAttachment(
                                  attachment.id
                                )
                              }
                              className="
                                absolute
                                right-1.5
                                top-1.5
                                flex h-6
                                w-6
                                items-center
                                justify-center
                                rounded-full
                                bg-black/65
                                text-white
                                backdrop-blur-sm
                                transition
                                hover:bg-black/80
                              "
                            >
                              <X
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-20 w-56 items-center gap-3 p-3 pr-9">
                            <div
                              className="
                                flex h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-black/[0.04]
                                dark:bg-white/[0.06]
                              "
                            >
                              {isImage ? (
                                <ImageIcon
                                  size={
                                    18
                                  }
                                />
                              ) : (
                                <File
                                  size={
                                    18
                                  }
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-ink dark:text-paper">
                                {
                                  attachment.fileName
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] text-muted-light dark:text-muted-dark">
                                {formatFileSize(
                                  attachment.sizeBytes
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              aria-label={`Remove ${attachment.fileName}`}
                              onClick={() =>
                                handleRemoveAttachment(
                                  attachment.id
                                )
                              }
                              className="
                                absolute
                                right-2
                                top-2
                                flex h-6
                                w-6
                                items-center
                                justify-center
                                rounded-full
                                text-muted-light
                                transition
                                hover:bg-black/[0.06]
                                hover:text-ink
                                dark:text-muted-dark
                                dark:hover:bg-white/[0.08]
                                dark:hover:text-paper
                              "
                            >
                              <X
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <div className="pb-1">
            <MessageInput
              onSend={
                handleSend
              }
              onStop={
                stop
              }
              onAttachImage={
                handleAttachImage
              }
              onAttachFile={
                handleAttachFile
              }
              onImport={
                handleImport
              }
              onExport={
                handleExport
              }
              hasAttachments={
                pendingAttachments.length >
                0
              }
              isStreaming={
                isStreaming ||
                isRunningAction
              }
              disabled={
                uploadProgress !==
                null
              }
              disabledReason={
                uploadProgress
                  ? 'Wait for the attachment upload to finish.'
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      <ConversationSettingsModal
        open={
          conversationSettingsOpen
        }
        onClose={() =>
          setConversationSettingsOpen(
            false
          )
        }
        conversation={
          conversation
        }
        onSaved={() => {
          reload();
          refreshList();
        }}
      />
    </div>
  );
}