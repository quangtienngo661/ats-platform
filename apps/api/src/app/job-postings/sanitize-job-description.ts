import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li'];

export function sanitizeJobDescription(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
  });
}

export function sanitizeJobPosting<T extends { description?: string | null } | null>(
  posting: T,
): T {
  if (!posting || typeof posting.description !== 'string') return posting;
  return { ...posting, description: sanitizeJobDescription(posting.description) } as T;
}
