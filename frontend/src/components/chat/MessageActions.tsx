import { useState } from 'react';
import { Check, Copy, RotateCcw } from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';

interface MessageActionsProps {
  content: string;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  disabled?: boolean;
}

export function MessageActions({
  content,
  showRegenerate,
  onRegenerate,
  disabled,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <IconButton label={copied ? 'Copied' : 'Copy message'} size="sm" onClick={handleCopy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </IconButton>
      {showRegenerate && (
        <IconButton
          label="Regenerate response"
          size="sm"
          onClick={onRegenerate}
          disabled={disabled}
        >
          <RotateCcw size={14} />
        </IconButton>
      )}
    </div>
  );
}
