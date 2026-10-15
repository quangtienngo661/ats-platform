const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  weekday: 'long',
});

export function formatInterviewTime(
  startAt: Date | string,
  durationMinutes: number,
): string {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  return `${timeFormatter.format(start)}–${timeFormatter.format(end)}, ${weekdayFormatter.format(start)}, ${formatVietnamDate(start)} (giờ Việt Nam)`;
}

export function formatVietnamDate(at: Date | string): string {
  return dateFormatter.format(new Date(at));
}

export function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

export function fillLayout(
  layout: string,
  values: { title: string; contentHtml: string },
): string {
  const title = escapeHtml(values.title);

  return layout.replace(/\{\{(title|content)\}\}/g, (_, placeholder: string) =>
    placeholder === 'title' ? title : values.contentHtml,
  );
}
