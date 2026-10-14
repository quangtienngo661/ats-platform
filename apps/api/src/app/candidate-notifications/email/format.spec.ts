import {
  formatInterviewTime,
  formatVietnamDate,
  escapeHtml,
  fillLayout,
} from './format';

describe('email format', () => {
  it('formats 02:30Z for 60 minutes as 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)', () => {
    expect(formatInterviewTime('2026-10-20T02:30:00Z', 60)).toBe(
      '09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
    );
  });

  it('crosses midnight as 23:30–00:30 on the start date', () => {
    expect(formatInterviewTime(new Date('2026-10-20T16:30:00Z'), 60)).toBe(
      '23:30–00:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
    );
  });

  it('uses the Vietnam date for 17:00Z', () => {
    expect(formatInterviewTime('2026-10-19T17:00:00Z', 60)).toBe(
      '00:00–01:00, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
    );
  });

  it('formatVietnamDate gives 14/10/2026 for 2026-10-13T20:00:00Z', () => {
    expect(formatVietnamDate('2026-10-13T20:00:00Z')).toBe('14/10/2026');
    expect(formatVietnamDate(new Date('2026-10-13T20:00:00Z'))).toBe(
      '14/10/2026',
    );
  });

  it('escapeHtml escapes & < > " and \'', () => {
    expect(escapeHtml('& < > " \'')).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  it('fillLayout inserts $&, $1 and {{content}} literally', () => {
    const layout =
      '<!doctype html><html><head><title>{{title}}</title></head><body><h1>{{title}}</h1><main>{{content}}</main></body></html>';
    const title = '<b>Tin mới</b> & $& $1 {{content}}';
    const escapedTitle =
      '&lt;b&gt;Tin mới&lt;/b&gt; &amp; $&amp; $1 {{content}}';
    const contentHtml = '<p>Nội dung $& $1 {{content}}</p>';

    const html = fillLayout(layout, { title, contentHtml });

    expect(html).toBe(
      `<!doctype html><html><head><title>${escapedTitle}</title></head><body><h1>${escapedTitle}</h1><main>${contentHtml}</main></body></html>`,
    );
    expect(html).toContain(`<title>${escapedTitle}</title>`);
    expect(html).toContain(`<h1>${escapedTitle}</h1>`);
    expect(html).toContain('<main><p>Nội dung $& $1 {{content}}</p></main>');
    expect(html).not.toContain('<b>Tin mới</b>');
  });
});
