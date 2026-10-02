export function localTestUrl(value: string): string {
  const url = new URL(value);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error(
      'E2E chỉ chạy trên localhost; hãy dùng API/web và dữ liệu test riêng.',
    );
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Địa chỉ E2E phải dùng HTTP hoặc HTTPS.');
  }
  return url.toString().replace(/\/$/, '');
}

export const apiBaseUrl = () =>
  localTestUrl(process.env.WEB_E2E_API_URL ?? 'http://localhost:5000/api');
