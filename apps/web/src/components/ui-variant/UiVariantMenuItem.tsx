'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setUiVariantAction } from '@/servers/ui/ui-variant.action';

type UiVariantMenuItemProps = {
  className?: string;
  onDone?: () => void;
};

// Account-menu entry that goes back to the legacy UI.
export function UiVariantMenuItem({ className, onDone }: UiVariantMenuItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchToLegacy = () => {
    startTransition(async () => {
      await setUiVariantAction('legacy');
      router.refresh();
      onDone?.();
    });
  };

  return (
    <button type="button" className={className} onClick={switchToLegacy} disabled={pending}>
      Dùng giao diện cũ
    </button>
  );
}
