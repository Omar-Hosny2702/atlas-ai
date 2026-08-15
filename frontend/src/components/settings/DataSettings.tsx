import { useRef, useState, type ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { downloadTextFile } from '@/utils/downloadFile';
import { readFileAsText } from '@/utils/readFile';
import { exportConversation, importConversations } from '@/api/conversationApi';
import { useConversations } from '@/context/ConversationContext';
import { useToast } from '@/context/ToastContext';

export function DataSettings() {
  const { activeId, refreshList } = useConversations();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async (format: 'md' | 'txt' | 'json') => {
    if (!activeId) return;
    try {
      const content = await exportConversation(activeId, format);
      const filename = `conversation-${activeId}.${format === 'json' ? 'json' : format === 'txt' ? 'txt' : 'md'}`;
      downloadTextFile(filename, content, format === 'json' ? 'application/json' : 'text/plain');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not export that chat.', 'error');
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text);
      const created = await importConversations(parsed);
      await refreshList();
      showToast(
        `Imported ${created.length} conversation${created.length === 1 ? '' : 's'}.`,
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not import that file.',
        'error'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Export current chat</h3>
        <p className="text-xs text-muted-light dark:text-muted-dark mb-3">
          {activeId
            ? 'Download the open conversation in your preferred format.'
            : 'Open a conversation first to export it.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!activeId} onClick={() => handleExport('md')}>
            <Download size={14} /> Markdown
          </Button>
          <Button size="sm" disabled={!activeId} onClick={() => handleExport('txt')}>
            <Download size={14} /> Plain text
          </Button>
          <Button size="sm" disabled={!activeId} onClick={() => handleExport('json')}>
            <Download size={14} /> JSON
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Import conversations</h3>
        <p className="text-xs text-muted-light dark:text-muted-dark mb-3">
          Import a JSON file previously exported from Atlas AI (or any file matching the same
          shape). Imported chats are added alongside your existing history.
        </p>
        <Button size="sm" onClick={handleImportClick} disabled={importing}>
          <Upload size={14} /> {importing ? 'Importing…' : 'Choose file…'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>
    </div>
  );
}
