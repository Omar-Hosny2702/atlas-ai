import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { ModelSettings, type ModelSettingsValues } from './ModelSettings';
import { updateConversation } from '@/api/conversationApi';
import { useToast } from '@/context/ToastContext';
import type { ConversationWithMessages } from '@/types';

interface ConversationSettingsModalProps {
  open: boolean;
  onClose: () => void;
  conversation: ConversationWithMessages | null;
  onSaved: () => void;
}

export function ConversationSettingsModal({
  open,
  onClose,
  conversation,
  onSaved,
}: ConversationSettingsModalProps) {
  const [values, setValues] = useState<ModelSettingsValues | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open && conversation) {
      setValues({
        model: conversation.model,
        systemPrompt: conversation.systemPrompt,
        temperature: conversation.temperature,
        maxTokens: conversation.maxTokens,
        topP: conversation.topP,
      });
    }
  }, [open, conversation]);

  const handleSave = async () => {
    if (!conversation || !values) return;
    setSaving(true);
    try {
      await updateConversation(conversation.id, values);
      showToast('Chat settings updated.', 'success');
      onSaved();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!conversation || !values) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chat settings"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <p className="text-xs text-muted-light dark:text-muted-dark mb-4">
        These settings apply only to this conversation.
      </p>
      <ModelSettings values={values} onChange={(patch) => setValues((v) => (v ? { ...v, ...patch } : v))} />
    </Modal>
  );
}
