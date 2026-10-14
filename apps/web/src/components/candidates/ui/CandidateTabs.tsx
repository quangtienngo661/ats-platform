'use client';

import { useRef } from 'react';
import { SFT } from '@/types/fonts/fonts';

type CandidateTab = 'overview' | 'evaluation' | 'notes';

interface CandidateTabsProps {
  tabs: { id: CandidateTab; label: string }[];
  active: CandidateTab;
  onChange: (tab: CandidateTab) => void;
}

export function CandidateTabs({ tabs, active, onChange }: CandidateTabsProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <div
      role="tablist"
      aria-label="Thông tin ứng viên"
      className="flex gap-2 overflow-x-auto border-b border-[#E5E5EA] mb-6"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(button) => {
            buttons.current[index] = button;
          }}
          type="button"
          role="tab"
          id={`candidate-tab-${tab.id}`}
          aria-controls={`candidate-panel-${tab.id}`}
          aria-selected={active === tab.id}
          tabIndex={active === tab.id ? 0 : -1}
          className={`min-h-11 px-4 py-3 text-[14px] whitespace-nowrap border-b-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0071E3] focus-visible:-outline-offset-2 ${active === tab.id ? 'border-[#0071E3] text-[#0071E3]' : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'}`}
          style={{ fontFamily: SFT, fontWeight: 500 }}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft')
              next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            onChange(tabs[next].id);
            buttons.current[next]?.focus();
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
