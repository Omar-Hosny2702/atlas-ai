import {
  useEffect,
  useState,
} from 'react';

import {
  ExternalLink,
  FileText,
  Loader2,
} from 'lucide-react';

import {
  BASE_URL,
} from '@/api/client';

import {
  getAccessToken,
} from '@/auth/authClient';

interface PrivateAttachmentProps {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  image?: boolean;
}

function formatFileSize(
  bytes: number
): string {
  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

async function fetchPrivateAttachment(
  attachmentId: string
): Promise<Blob> {
  const token =
    getAccessToken();

  const response =
    await fetch(
      `${BASE_URL}/attachments/${attachmentId}/content`,
      {
        headers:
          token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Attachment request failed: ${response.status}`
    );
  }

  return response.blob();
}

export function PrivateAttachment({
  id,
  fileName,
  mimeType,
  sizeBytes,
  image = false,
}: PrivateAttachmentProps) {
  const [
    objectUrl,
    setObjectUrl,
  ] =
    useState<
      string | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(
      image
    );

  const [
    failed,
    setFailed,
  ] =
    useState(false);

  useEffect(
    () => {
      if (!image) {
        return;
      }

      let cancelled =
        false;

      let createdUrl:
        string | null =
        null;

      void fetchPrivateAttachment(
        id
      )
        .then(
          (blob) => {
            if (
              cancelled
            ) {
              return;
            }

            createdUrl =
              URL.createObjectURL(
                blob
              );

            setObjectUrl(
              createdUrl
            );
          }
        )
        .catch(
          () => {
            if (
              !cancelled
            ) {
              setFailed(
                true
              );
            }
          }
        )
        .finally(
          () => {
            if (
              !cancelled
            ) {
              setLoading(
                false
              );
            }
          }
        );

      return () => {
        cancelled =
          true;

        if (
          createdUrl
        ) {
          URL.revokeObjectURL(
            createdUrl
          );
        }
      };
    },
    [
      id,
      image,
    ]
  );

  const openFile =
    async () => {
      try {
        const blob =
          await fetchPrivateAttachment(
            id
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            'a'
          );

        anchor.href =
          url;

        anchor.target =
          '_blank';

        anchor.rel =
          'noopener noreferrer';

        anchor.download =
          fileName;

        document.body.appendChild(
          anchor
        );

        anchor.click();
        anchor.remove();

        setTimeout(
          () =>
            URL.revokeObjectURL(
              url
            ),
          60_000
        );
      } catch {
        setFailed(
          true
        );
      }
    };

  if (image) {
    if (loading) {
      return (
        <div
          className="
            flex h-28 w-40
            items-center
            justify-center
            rounded-[15px]
            bg-black/20
          "
        >
          <Loader2
            size={20}
            className="animate-spin opacity-60"
          />
        </div>
      );
    }

    if (
      failed ||
      !objectUrl
    ) {
      return (
        <button
          type="button"
          onClick={
            openFile
          }
          className="
            flex h-28 w-40
            items-center
            justify-center
            rounded-[15px]
            bg-black/20
            px-3
            text-center
            text-xs
            text-white/65
          "
        >
          Image could not be previewed
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={
          openFile
        }
        className="
          block
          overflow-hidden
          rounded-[15px]
          bg-black/20
        "
      >
        <img
          src={
            objectUrl
          }
          alt={
            fileName
          }
          className="
            max-h-[420px]
            w-full
            object-cover
          "
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={
        openFile
      }
      className="
        flex
        min-w-[220px]
        items-center
        gap-3
        rounded-xl
        bg-white/[0.08]
        px-3
        py-2.5
        text-left
        transition
        hover:bg-white/[0.12]
      "
    >
      <div
        className="
          flex h-9 w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-white/[0.09]
        "
      >
        <FileText
          size={18}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {fileName}
        </p>

        <p className="mt-0.5 text-[11px] text-white/55">
          {formatFileSize(
            sizeBytes
          )}
        </p>
      </div>

      <ExternalLink
        size={14}
        className="shrink-0 opacity-60"
      />
    </button>
  );
}