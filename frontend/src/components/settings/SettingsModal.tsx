import { useState } from 'react';
import clsx from 'clsx';

import { Modal } from '@/components/common/Modal';
import { useSettings } from '@/context/SettingsContext';

import { GeneralSettings } from './GeneralSettings';
import { AccountSettings } from './AccountSettings';
import { ModelSettings } from './ModelSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { PersonalisationSettings } from './PersonalisationSettings';
import { MemorySettings } from './MemorySettings';
import { DataSettings } from './DataSettings';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const TABS = [
  'General',
  'Account',
  'Model defaults',
  'Appearance',
  'Personalisation',
  'Memory',
  'Data',
] as const;

type Tab = (typeof TABS)[number];

export function SettingsModal({
  open,
  onClose,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('General');
  const { defaults, setDefaults } = useSettings();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      size="lg"
    >
      <div className="flex flex-col gap-5 -mt-1 sm:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto sm:w-40 sm:flex-col sm:overflow-visible">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={clsx(
                'whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors',
                tab === item
                  ? 'bg-accent-100 font-medium text-accent-800 dark:bg-ink-raised dark:text-paper'
                  : 'text-muted-light hover:bg-paper-alt dark:text-muted-dark dark:hover:bg-ink-raised'
              )}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="min-w-0 grow">
          {tab === 'General' && <GeneralSettings />}

          {tab === 'Account' && <AccountSettings />}

          {tab === 'Model defaults' && (
            <>
              <p className="mb-4 text-xs text-muted-light dark:text-muted-dark">
                These apply to every new chat you start. You can still
                override them for an individual conversation from its own
                settings icon.
              </p>

              <ModelSettings
                values={defaults}
                onChange={setDefaults}
              />
            </>
          )}

          {tab === 'Appearance' && <AppearanceSettings />}

          {tab === 'Personalisation' && (
            <PersonalisationSettings />
          )}

          {tab === 'Memory' && <MemorySettings />}

          {tab === 'Data' && <DataSettings />}
        </div>
      </div>
    </Modal>
  );
}