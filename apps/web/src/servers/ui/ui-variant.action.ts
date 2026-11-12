'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { UI_VARIANT_COOKIE, type UiVariant } from '@/lib/ui-variant';

export async function setUiVariantAction(variant: UiVariant): Promise<void> {
  if (variant !== 'legacy' && variant !== 'modern') {
    throw new Error('Invalid UI variant');
  }
  const cookieStore = await cookies();
  cookieStore.set(UI_VARIANT_COOKIE, variant, {
    path: '/',
    maxAge: 31536000,
    sameSite: 'lax',
    httpOnly: true,
  });
  revalidatePath('/', 'layout');
}
