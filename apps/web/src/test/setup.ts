import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no window.scrollTo and logs "Not implemented" on each call. Motion calls it to restore the scroll
// position after measuring keyframes such as `height: auto` (the legacy JobSearchClient filters). Files that run in
// the node environment have no window.
if (typeof window !== 'undefined') window.scrollTo = vi.fn() as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
