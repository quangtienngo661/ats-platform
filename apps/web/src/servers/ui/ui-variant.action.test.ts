import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setUiVariantAction } from './ui-variant.action';

const set = vi.fn();
const revalidatePath = vi.fn();

vi.mock('next/headers', () => ({ cookies: async () => ({ set }) }));
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

beforeEach(() => {
  set.mockReset();
  revalidatePath.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('setUiVariantAction', () => {
  it.each([
    ['production', true],
    ['development', false],
  ])('sets secure on the cookie only in production (%s)', async (env, secure) => {
    vi.stubEnv('NODE_ENV', env);

    await setUiVariantAction('legacy');

    expect(set).toHaveBeenCalledWith('talentai-ui', 'legacy', expect.objectContaining({ secure }));
  });

  it('writes the cookie and revalidates the whole layout', async () => {
    await setUiVariantAction('legacy');

    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith('talentai-ui', 'legacy', {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      httpOnly: true,
      secure: false,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('stores modern as well', async () => {
    await setUiVariantAction('modern');

    expect(set).toHaveBeenCalledWith('talentai-ui', 'modern', expect.objectContaining({ path: '/' }));
  });

  it.each(['LEGACY', '', 'x'])('rejects %j without writing the cookie', async (value) => {
    await expect(setUiVariantAction(value as never)).rejects.toThrow('Invalid UI variant');

    expect(set).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
