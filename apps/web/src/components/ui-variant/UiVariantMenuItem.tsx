'use client';

import { useSwitchUiVariant } from './useSwitchUiVariant';

type UiVariantMenuItemProps = {
  className?: string;
  onDone?: () => void;
};

// Plain-button entry that goes back to the legacy UI. Inside a Radix menu, call `useSwitchUiVariant` from a
// `DropdownMenuItem` instead (see `AccountMenu`), so the entry is a real menuitem.
export function UiVariantMenuItem({ className, onDone }: UiVariantMenuItemProps) {
  const { switchTo, pending } = useSwitchUiVariant();

  return (
    <button type="button" className={className} onClick={() => switchTo('legacy', onDone)} disabled={pending}>
      Dùng giao diện cũ
    </button>
  );
}
