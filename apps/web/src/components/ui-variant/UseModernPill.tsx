'use client';

import { useSwitchUiVariant } from './useSwitchUiVariant';

// z-index is plain CSS: the z-index tokens do not exist yet.
const pillStyle = {
  position: 'fixed',
  left: 16,
  bottom: 16,
  zIndex: 70,
  padding: '8px 14px',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 9999,
  background: '#ffffff',
  color: '#1d1d1f',
  fontSize: 13,
  lineHeight: '18px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  cursor: 'pointer',
} as const;

export function UseModernPill() {
  const { switchTo, pending } = useSwitchUiVariant();

  return (
    <button type="button" style={pillStyle} onClick={() => switchTo('modern')} disabled={pending}>
      Dùng giao diện mới
    </button>
  );
}
