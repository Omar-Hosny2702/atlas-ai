import { useState } from 'react';
import clsx from 'clsx';
import { Modal } from '@/components/common/Modal';
import { GeneralSettings } from './GeneralSettings';
import { ModelSettings } from './ModelSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { DataSettings } from './DataSettings';
import { useSettings } from '@/context/SettingsContext';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const TABS = ['General', 'Model defaults', 'Appearance', 'Data'] as const;
type Tab = (typeof TABS)[number];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('General');
  const { defaults, setDefaults } = useSettings();

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="lg">
      <div className="flex flex-col sm:flex-row gap-5 -mt-1">
        <nav className="flex sm:flex-col gap-1 shrink-0 sm:w-40 overflow-x-auto sm:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'text-left text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors',
                tab === t
                  ? 'bg-accent-100 dark:bg-ink-raised text-accent-800 dark:text-paper font-medium'
                  : 'hover:bg-paper-alt dark:hover:bg-ink-raised text-muted-light dark:text-muted-dark'
              )}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="grow min-w-0">
          {tab === 'General' && <GeneralSettings />}
          {tab === 'Model defaults' && (
            <>
              <p className="text-xs text-muted-light dark:text-muted-dark mb-4">
                These apply to every new chat you start. You can still override them for an
                individual conversation from its own settings icon.
              </p>
              <ModelSettings values={defaults} onChange={setDefaults} />
            </>
          )}
          {tab === 'Appearance' && <AppearanceSettings />}
          {tab === 'Data' && <DataSettings />}
        </div>
      </div>
    </Modal>
  );
}
