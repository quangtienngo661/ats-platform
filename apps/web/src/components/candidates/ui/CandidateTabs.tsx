'use client';

import type { ReactNode } from 'react';
import { Tabs } from '@/components/ui';

type CandidateTab = 'overview' | 'evaluation' | 'notes';

interface CandidateTabsProps {
  tabs: { id: CandidateTab; label: string; content?: ReactNode }[];
  active: CandidateTab;
  onChange: (tab: CandidateTab) => void;
}

/** The candidate's tab bar and the active panel, on the shared `Tabs` primitive. */
export function CandidateTabs({ tabs, active, onChange }: CandidateTabsProps) {
  return (
    <Tabs
      tabs={tabs.map((tab) => ({ value: tab.id, label: tab.label, content: tab.content ?? null }))}
      value={active}
      onValueChange={(value) => {
        const next = tabs.find((tab) => tab.id === value);
        if (next) onChange(next.id);
      }}
    />
  );
}
