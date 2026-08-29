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
  'About',
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
      <div className="-mt-1 flex flex-col gap-6 sm:flex-row">
        <nav
          className="
            flex shrink-0 gap-1 overflow-x-auto
            border-b border-black/[0.06] pb-3
            dark:border-white/[0.07]
            sm:w-44 sm:flex-col sm:overflow-visible
            sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4
          "
        >
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={clsx(
                `
                  whitespace-nowrap
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  transition
                `,
                tab === item
                  ? `
                    bg-black/[0.06]
                    font-medium
                    text-ink
                    dark:bg-white/[0.08]
                    dark:text-paper
                  `
                  : `
                    text-muted-light
                    hover:bg-black/[0.035]
                    hover:text-ink
                    dark:text-muted-dark
                    dark:hover:bg-white/[0.05]
                    dark:hover:text-paper
                  `
              )}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="min-w-0 grow">
          {tab === 'General' && (
            <GeneralSettings />
          )}

          {tab === 'Account' && (
            <AccountSettings />
          )}

          {tab === 'Model defaults' && (
            <>
              <p className="mb-4 text-xs leading-relaxed text-muted-light dark:text-muted-dark">
                These apply to every new chat you start. You can still
                override them for an individual conversation from its own
                settings.
              </p>

              <ModelSettings
                values={defaults}
                onChange={setDefaults}
              />
            </>
          )}

          {tab === 'Appearance' && (
            <AppearanceSettings />
          )}

          {tab === 'Personalisation' && (
            <PersonalisationSettings />
          )}

          {tab === 'Memory' && (
            <MemorySettings />
          )}

          {tab === 'Data' && (
            <DataSettings />
          )}

          {tab === 'About' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-ink dark:text-paper">
                  Atlas AI
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-muted-light dark:text-muted-dark">
                  A personal AI workspace for chat, research, planning,
                  explanations, memory, and Atlas Actions.
                </p>
              </div>

              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border border-black/[0.07]
                  dark:border-white/[0.08]
                "
              >
                <div
                  className="
                    flex items-center justify-between
                    border-b border-black/[0.06]
                    px-4 py-3
                    dark:border-white/[0.07]
                  "
                >
                  <span className="text-sm text-muted-light dark:text-muted-dark">
                    Version
                  </span>

                  <span className="text-sm font-medium text-ink dark:text-paper">
                    1.0.0
                  </span>
                </div>

                <div
                  className="
                    flex items-center justify-between
                    border-b border-black/[0.06]
                    px-4 py-3
                    dark:border-white/[0.07]
                  "
                >
                  <span className="text-sm text-muted-light dark:text-muted-dark">
                    Made by
                  </span>

                  <span className="text-sm font-medium text-ink dark:text-paper">
                    Omar Hosny
                  </span>
                </div>

                <div
                  className="
                    flex items-center justify-between
                    gap-4
                    px-4 py-3
                  "
                >
                  <span className="text-sm text-muted-light dark:text-muted-dark">
                    Website
                  </span>

                  <a
                    href="https://www.omarhosny.work.gd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      truncate
                      text-sm
                      font-medium
                      text-accent-500
                      hover:underline
                      hover:underline-offset-2
                    "
                  >
                    www.omarhosny.work.gd
                  </a>
                </div>
              </div>

              <p className="text-xs text-muted-light dark:text-muted-dark">
                © 2026 Omar Hosny. All rights reserved.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}