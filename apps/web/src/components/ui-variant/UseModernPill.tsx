'use client';

import { useSwitchUiVariant } from './useSwitchUiVariant';

export function UseModernPill() {
  const { switchTo, pending } = useSwitchUiVariant();

  return (
    <button
      type="button"
      onClick={() => switchTo('modern')}
      disabled={pending}
      className="fixed bottom-4 left-4 z-toast cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-body-sm text-ink shadow-e3"
    >
      Dùng giao diện mới
    </button>
  );
}
