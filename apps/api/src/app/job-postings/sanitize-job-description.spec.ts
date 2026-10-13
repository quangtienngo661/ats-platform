import { sanitizeJobDescription } from './sanitize-job-description';

describe('sanitizeJobDescription', () => {
  it('retains only the supported rich text tags', () => {
    expect(sanitizeJobDescription('<p class="lead">Hello <strong>world</strong><br><em>today</em></p><ul><li>One</li></ul>'))
      .toBe('<p>Hello <strong>world</strong><br /><em>today</em></p><ul><li>One</li></ul>');
  });

  it('removes scripts, event handlers, links and embedded content', () => {
    const output = sanitizeJobDescription('<p onclick="alert(1)">Safe</p><script>alert(2)</script><a href="javascript:alert(3)">Text</a><svg><foreignObject><img src=x onerror=alert(4)></foreignObject></svg>');
    expect(output).toContain('<p>Safe</p>');
    expect(output).not.toMatch(/script|onclick|javascript:|onerror|<svg|<img|<a/i);
  });
});
