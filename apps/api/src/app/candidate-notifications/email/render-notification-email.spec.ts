import { EmailNotificationType } from '@ats-platform/database';
import type {
  ApplicationContext,
  CancelledScheduleLine,
  NotificationEmailPayload,
  RenderedEmail,
  ScheduleDetails,
} from './notification-email.types';
import { renderNotificationEmail } from './render-notification-email';

describe('renderNotificationEmail', () => {
  const layout = '<h1>{{title}}</h1><main>{{content}}</main>';
  const options = { clientUrl: 'http://localhost:3001', layout };
  const footer = 'Đây là email tự động, vui lòng không trả lời.';
  const context: ApplicationContext = {
    applicationId: 'c2ba6519-7149-4af6-b335-f456fdd0c020',
    candidateName: 'Nguyễn Minh Anh',
    jobTitle: 'Kỹ sư Backend NestJS',
    organizationName: 'Công ty Công nghệ Sao Việt',
    appliedAt: '2026-10-13T20:00:00Z',
  };
  const onlineSchedule: ScheduleDetails = {
    interviewId: 'd8c436c5-3017-4635-9c1f-5334f9987404',
    startAt: '2026-10-20T02:30:00Z',
    durationMinutes: 60,
    interviewType: 'online',
    onlineMeetingLink:
      'https://meet.example.com/backend-interview?room=nest&invite=minh-anh',
    location: null,
    interviewerName: 'Trần Hoàng Nam',
  };

  const buildPayload = (
    overrides: Partial<NotificationEmailPayload> = {},
  ): NotificationEmailPayload => ({ context: { ...context }, ...overrides });

  const payloadForType = (
    type: EmailNotificationType,
  ): NotificationEmailPayload =>
    buildPayload(
      type.startsWith('schedule_')
        ? {
            schedule: { ...onlineSchedule },
            ...(type === EmailNotificationType.schedule_updated
              ? { previous: { startAt: '2026-10-20T01:30:00Z' } }
              : {}),
          }
        : {},
    );

  const visibleHtml = (html: string): string => html.replace(/<[^>]*>/g, '');

  const expectInBoth = (email: RenderedEmail, sentence: string) => {
    expect(visibleHtml(email.html)).toContain(sentence);
    expect(email.text).toContain(sentence);
  };

  const expectAnchor = (
    email: RenderedEmail,
    escapedHref: string,
    escapedLabel: string,
  ) => {
    const anchor = Array.from(
      email.html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gs),
    ).find((match) => match[1] === escapedHref);

    expect(email.html).toContain(`href="${escapedHref}"`);
    expect(anchor && visibleHtml(anchor[2])).toBe(escapedLabel);
  };

  const cases: Array<{
    type: EmailNotificationType;
    subject: string;
    sentences: string[];
  }> = [
    {
      type: EmailNotificationType.application_received,
      subject: 'Đã nhận đơn ứng tuyển: Kỹ sư Backend NestJS',
      sentences: [
        'Chúng tôi đã nhận đơn ứng tuyển của bạn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt ngày 14/10/2026.',
      ],
    },
    {
      type: EmailNotificationType.application_interview,
      subject: 'Bạn được mời vào vòng phỏng vấn: Kỹ sư Backend NestJS',
      sentences: [
        'Đơn ứng tuyển của bạn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt đã được chuyển sang vòng phỏng vấn.',
        'Nhà tuyển dụng sẽ gửi lịch phỏng vấn cho bạn.',
      ],
    },
    {
      type: EmailNotificationType.application_offer,
      subject: 'Đề nghị tuyển dụng: Kỹ sư Backend NestJS',
      sentences: [
        'Đơn ứng tuyển của bạn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt đã được chuyển sang vòng đề nghị tuyển dụng.',
      ],
    },
    {
      type: EmailNotificationType.application_hired,
      subject: 'Chúc mừng bạn đã trúng tuyển: Kỹ sư Backend NestJS',
      sentences: [
        'Chúc mừng! Bạn đã trúng tuyển vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt.',
      ],
    },
    {
      type: EmailNotificationType.application_rejected,
      subject: 'Kết quả đơn ứng tuyển: Kỹ sư Backend NestJS',
      sentences: [
        'Cảm ơn bạn đã quan tâm đến vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt.',
        'Sau khi xem xét, hồ sơ của bạn chưa phù hợp với vị trí này ở thời điểm hiện tại.',
      ],
    },
    {
      type: EmailNotificationType.schedule_created,
      subject: 'Lịch phỏng vấn: Kỹ sư Backend NestJS',
      sentences: [
        'Bạn có lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt.',
      ],
    },
    {
      type: EmailNotificationType.schedule_updated,
      subject: 'Lịch phỏng vấn đã thay đổi: Kỹ sư Backend NestJS',
      sentences: [
        'Lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt đã thay đổi. Thông tin mới:',
      ],
    },
    {
      type: EmailNotificationType.schedule_cancelled,
      subject: 'Lịch phỏng vấn đã bị hủy: Kỹ sư Backend NestJS',
      sentences: [
        'Buổi phỏng vấn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt lúc 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam) (Trực tuyến) đã bị hủy.',
      ],
    },
  ];

  it.each(cases)('subject of $type', ({ type, subject, sentences }) => {
    const email = renderNotificationEmail(type, payloadForType(type), options);

    expect(email.subject).toBe(subject);
    expect(email.html).toContain(`<h1>${subject}</h1><main>`);
    expect(email.html.trim().endsWith('</main>')).toBe(true);
    expect(
      visibleHtml(email.html)
        .slice(subject.length)
        .trim()
        .startsWith('Chào Nguyễn Minh Anh,'),
    ).toBe(true);
    expect(email.text.trim().startsWith('Chào Nguyễn Minh Anh,')).toBe(true);

    let lastHtmlIndex = -1;
    let lastTextIndex = -1;
    for (const sentence of sentences) {
      expectInBoth(email, sentence);
      expect(email.html.indexOf(sentence)).toBeGreaterThan(lastHtmlIndex);
      expect(email.text.indexOf(sentence)).toBeGreaterThan(lastTextIndex);
      lastHtmlIndex = email.html.indexOf(sentence);
      lastTextIndex = email.text.indexOf(sentence);
    }
  });

  it('application_received states the job, organization and Vietnam date', () => {
    const email = renderNotificationEmail(
      EmailNotificationType.application_received,
      buildPayload(),
      options,
    );

    expectInBoth(email, 'Chào Nguyễn Minh Anh,');
    expectInBoth(
      email,
      'Chúng tôi đã nhận đơn ứng tuyển của bạn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt ngày 14/10/2026.',
    );
    expect(email.html).not.toContain('13/10/2026');
    expect(email.text).not.toContain('13/10/2026');
  });

  it('application_rejected is neutral and lists each cancelled interview', () => {
    const cancelledSchedules: CancelledScheduleLine[] = [
      {
        startAt: '2026-10-20T02:30:00Z',
        durationMinutes: 60,
        interviewType: 'online',
      },
      {
        startAt: '2026-10-20T16:30:00Z',
        durationMinutes: 60,
        interviewType: 'onsite',
      },
    ];
    const cancellationLines = [
      'Buổi phỏng vấn lúc 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam) đã được hủy.',
      'Buổi phỏng vấn lúc 23:30–00:30, Thứ Ba, 20/10/2026 (giờ Việt Nam) đã được hủy.',
    ];
    const payloads = [
      buildPayload({ cancelledSchedules }),
      buildPayload({ cancelledSchedules: [] }),
      buildPayload(),
    ];

    for (const payload of payloads) {
      const email = renderNotificationEmail(
        EmailNotificationType.application_rejected,
        payload,
        options,
      );

      expectInBoth(
        email,
        'Cảm ơn bạn đã quan tâm đến vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt.',
      );
      expectInBoth(
        email,
        'Sau khi xem xét, hồ sơ của bạn chưa phù hợp với vị trí này ở thời điểm hiện tại.',
      );

      if (payload.cancelledSchedules?.length) {
        for (const line of cancellationLines) {
          expectInBoth(email, line);
        }
        expect(email.html.indexOf(cancellationLines[1])).toBeGreaterThan(
          email.html.indexOf(cancellationLines[0]),
        );
        expect(email.text.indexOf(cancellationLines[1])).toBeGreaterThan(
          email.text.indexOf(cancellationLines[0]),
        );
      } else {
        for (const line of cancellationLines) {
          expect(email.html).not.toContain(line);
          expect(email.text).not.toContain(line);
        }
        expect(email.html).not.toContain('Buổi phỏng vấn lúc');
        expect(email.text).not.toContain('Buổi phỏng vấn lúc');
      }
    }
  });

  it('schedule_created shows the online link as a link and the interviewer', () => {
    const email = renderNotificationEmail(
      EmailNotificationType.schedule_created,
      buildPayload({ schedule: { ...onlineSchedule } }),
      options,
    );
    const meetingLink =
      'https://meet.example.com/backend-interview?room=nest&invite=minh-anh';
    const escapedMeetingLink =
      'https://meet.example.com/backend-interview?room=nest&amp;invite=minh-anh';

    expectInBoth(
      email,
      'Bạn có lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt.',
    );
    expectInBoth(
      email,
      'Thời gian: 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
    );
    expectInBoth(email, 'Thời lượng: 60 phút');
    expectInBoth(email, 'Hình thức: Trực tuyến');
    expectInBoth(email, 'Người phỏng vấn: Trần Hoàng Nam');
    expect(visibleHtml(email.html)).toContain(
      `Link phòng họp: ${escapedMeetingLink}`,
    );
    expect(email.text).toContain(`Link phòng họp: ${meetingLink}`);
    expectAnchor(email, escapedMeetingLink, escapedMeetingLink);
    expect(email.html).not.toContain(`href="${meetingLink}"`);
    expect(email.html).not.toContain('Địa điểm:');
    expect(email.text).not.toContain('Địa điểm:');
  });

  it('schedule_created onsite without location says chưa cập nhật', () => {
    const email = renderNotificationEmail(
      EmailNotificationType.schedule_created,
      buildPayload({
        schedule: {
          ...onlineSchedule,
          interviewType: 'onsite',
          onlineMeetingLink: null,
          location: null,
        },
      }),
      options,
    );

    expectInBoth(
      email,
      'Bạn có lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt.',
    );
    expectInBoth(
      email,
      'Thời gian: 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
    );
    expectInBoth(email, 'Thời lượng: 60 phút');
    expectInBoth(email, 'Hình thức: Trực tiếp');
    expectInBoth(email, 'Địa điểm: chưa cập nhật');
    expectInBoth(email, 'Người phỏng vấn: Trần Hoàng Nam');
    expect(email.html).not.toContain('Link phòng họp:');
    expect(email.text).not.toContain('Link phòng họp:');
  });

  it('schedule_updated lists only the changed fields under Trước đây', () => {
    const updates: Array<{
      schedule: ScheduleDetails;
      previous: Partial<ScheduleDetails>;
      currentLines: string[];
      previousLines: string[];
      unchangedLabels: string[];
    }> = [
      {
        schedule: { ...onlineSchedule, startAt: '2026-10-20T03:30:00Z' },
        previous: {
          startAt: '2026-10-20T02:30:00Z',
          onlineMeetingLink: 'https://meet.example.com/old-room',
        },
        currentLines: [
          'Thời gian: 10:30–11:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
          'Thời lượng: 60 phút',
          'Hình thức: Trực tuyến',
          'Người phỏng vấn: Trần Hoàng Nam',
        ],
        previousLines: [
          'Thời gian: 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
          'Link phòng họp: https://meet.example.com/old-room',
        ],
        unchangedLabels: [
          'Thời lượng:',
          'Hình thức:',
          'Địa điểm:',
          'Người phỏng vấn:',
        ],
      },
      {
        schedule: {
          ...onlineSchedule,
          startAt: '2026-10-20T03:30:00Z',
          durationMinutes: 90,
        },
        previous: {
          startAt: '2026-10-20T02:30:00Z',
          durationMinutes: 45,
          interviewerName: 'Lê Minh Tuấn',
        },
        currentLines: [
          'Thời gian: 10:30–12:00, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
          'Thời lượng: 90 phút',
          'Hình thức: Trực tuyến',
          'Người phỏng vấn: Trần Hoàng Nam',
        ],
        previousLines: [
          'Thời gian: 09:30–10:15, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
          'Thời lượng: 45 phút',
          'Người phỏng vấn: Lê Minh Tuấn',
        ],
        unchangedLabels: ['Hình thức:', 'Link phòng họp:', 'Địa điểm:'],
      },
      {
        schedule: { ...onlineSchedule },
        previous: {
          interviewType: 'onsite',
          onlineMeetingLink: null,
          location: 'Phòng 3, 123 Nguyễn Huệ, TP. Hồ Chí Minh',
        },
        currentLines: [
          'Thời gian: 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
          'Thời lượng: 60 phút',
          'Hình thức: Trực tuyến',
          'Người phỏng vấn: Trần Hoàng Nam',
        ],
        previousLines: [
          'Hình thức: Trực tiếp',
          'Link phòng họp: không có',
          'Địa điểm: Phòng 3, 123 Nguyễn Huệ, TP. Hồ Chí Minh',
        ],
        unchangedLabels: ['Thời gian:', 'Thời lượng:', 'Người phỏng vấn:'],
      },
      {
        schedule: {
          ...onlineSchedule,
          interviewType: 'onsite',
          onlineMeetingLink: null,
          location: 'Tầng 5, 123 Nguyễn Huệ, TP. Hồ Chí Minh',
        },
        previous: { location: null },
        currentLines: [
          'Thời gian: 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)',
          'Thời lượng: 60 phút',
          'Hình thức: Trực tiếp',
          'Địa điểm: Tầng 5, 123 Nguyễn Huệ, TP. Hồ Chí Minh',
          'Người phỏng vấn: Trần Hoàng Nam',
        ],
        previousLines: ['Địa điểm: chưa cập nhật'],
        unchangedLabels: [
          'Thời gian:',
          'Thời lượng:',
          'Hình thức:',
          'Link phòng họp:',
          'Người phỏng vấn:',
        ],
      },
    ];

    for (const update of updates) {
      const email = renderNotificationEmail(
        EmailNotificationType.schedule_updated,
        buildPayload({ schedule: update.schedule, previous: update.previous }),
        options,
      );

      expectInBoth(
        email,
        'Lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt đã thay đổi. Thông tin mới:',
      );
      expectInBoth(email, 'Trước đây:');
      const currentHtml = visibleHtml(
        email.html.slice(0, email.html.indexOf('Trước đây:')),
      );
      const currentText = email.text.slice(0, email.text.indexOf('Trước đây:'));
      const previousHtml = visibleHtml(
        email.html.slice(email.html.indexOf('Trước đây:')),
      );
      const previousText = email.text.slice(email.text.indexOf('Trước đây:'));

      for (const line of update.currentLines) {
        expect(currentHtml).toContain(line);
        expect(currentText).toContain(line);
      }
      if (update.schedule.interviewType === 'online') {
        expect(currentHtml).toContain(
          'Link phòng họp: https://meet.example.com/backend-interview?room=nest&amp;invite=minh-anh',
        );
        expect(currentText).toContain(
          'Link phòng họp: https://meet.example.com/backend-interview?room=nest&invite=minh-anh',
        );
        expectAnchor(
          email,
          'https://meet.example.com/backend-interview?room=nest&amp;invite=minh-anh',
          'https://meet.example.com/backend-interview?room=nest&amp;invite=minh-anh',
        );
      } else {
        expect(currentHtml).not.toContain('Link phòng họp:');
        expect(currentText).not.toContain('Link phòng họp:');
      }
      for (const line of update.previousLines) {
        expect(previousHtml).toContain(line);
        expect(previousText).toContain(line);
      }
      for (const label of update.unchangedLabels) {
        expect(previousHtml).not.toContain(label);
        expect(previousText).not.toContain(label);
      }
    }
  });

  it('schedule_cancelled names the cancelled time and type', () => {
    for (const [interviewType, label] of [
      ['online', 'Trực tuyến'],
      ['onsite', 'Trực tiếp'],
    ] as const) {
      const email = renderNotificationEmail(
        EmailNotificationType.schedule_cancelled,
        buildPayload({
          schedule: {
            ...onlineSchedule,
            interviewType,
            onlineMeetingLink:
              interviewType === 'online'
                ? onlineSchedule.onlineMeetingLink
                : null,
          },
        }),
        options,
      );

      expectInBoth(
        email,
        `Buổi phỏng vấn cho vị trí Kỹ sư Backend NestJS tại Công ty Công nghệ Sao Việt lúc 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam) (${label}) đã bị hủy.`,
      );
    }
  });

  it('links application emails to /my-applications/:id and schedule emails to /my-interviews without a double slash', () => {
    for (const { type } of cases) {
      const email = renderNotificationEmail(type, payloadForType(type), {
        clientUrl: 'http://localhost:3001/',
        layout,
      });
      const applicationEmail = type.startsWith('application_');
      const label = applicationEmail
        ? 'Xem đơn ứng tuyển'
        : 'Xem lịch phỏng vấn';
      const url = applicationEmail
        ? 'http://localhost:3001/my-applications/c2ba6519-7149-4af6-b335-f456fdd0c020'
        : 'http://localhost:3001/my-interviews';

      expectAnchor(email, url, label);
      expect(email.text).toContain(`${label}: ${url}`);
      expect(email.html).not.toContain('http://localhost:3001//');
      expect(email.text).not.toContain('http://localhost:3001//');
    }
  });

  it('escapes user text in html but keeps it raw in text', () => {
    const email = renderNotificationEmail(
      EmailNotificationType.schedule_created,
      buildPayload({
        context: {
          ...context,
          candidateName: 'Nguyễn <Minh> & $&',
          jobTitle: '<script>alert(1)</script> & $&',
          organizationName: 'Công ty <Sao Việt> & $1 {{content}}',
        },
        schedule: {
          ...onlineSchedule,
          interviewerName: 'Trần <Hoàng> & $&',
        },
      }),
      options,
    );

    expect(email.subject).toBe(
      'Lịch phỏng vấn: <script>alert(1)</script> & $&',
    );
    expect(email.html).toContain(
      '<h1>Lịch phỏng vấn: &lt;script&gt;alert(1)&lt;/script&gt; &amp; $&amp;</h1><main>',
    );
    expect(email.html.trim().endsWith('</main>')).toBe(true);
    for (const [raw, escaped] of [
      ['Nguyễn <Minh> & $&', 'Nguyễn &lt;Minh&gt; &amp; $&amp;'],
      [
        '<script>alert(1)</script> & $&',
        '&lt;script&gt;alert(1)&lt;/script&gt; &amp; $&amp;',
      ],
      [
        'Công ty <Sao Việt> & $1 {{content}}',
        'Công ty &lt;Sao Việt&gt; &amp; $1 {{content}}',
      ],
      ['Trần <Hoàng> & $&', 'Trần &lt;Hoàng&gt; &amp; $&amp;'],
    ]) {
      expect(email.html).toContain(escaped);
      expect(email.html).not.toContain(raw);
      expect(email.text).toContain(raw);
      expect(email.text).not.toContain(escaped);
    }
    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('</script>');
    expect(email.text).toContain(
      'Bạn có lịch phỏng vấn cho vị trí <script>alert(1)</script> & $& tại Công ty <Sao Việt> & $1 {{content}}.',
    );
  });

  it('strips line breaks from the subject', () => {
    for (const { type, subject } of cases) {
      const payload = payloadForType(type);
      payload.context = {
        ...context,
        jobTitle: 'Kỹ sư Backend\r\nNestJS\nSenior\rEngineer',
      };
      const email = renderNotificationEmail(type, payload, options);

      expect(email.subject).toBe(
        subject.replace(
          'Kỹ sư Backend NestJS',
          'Kỹ sư BackendNestJSSeniorEngineer',
        ),
      );
      expect(email.subject).not.toContain('\r');
      expect(email.subject).not.toContain('\n');
    }
  });

  it('never prints a score or a rejection reason passed in the payload', () => {
    for (const { type } of cases) {
      const payload = {
        ...payloadForType(type),
        overallScore: 91,
        rejectionReason: 'Thiếu NestJS',
      } as any;
      const email = renderNotificationEmail(type, payload, options);

      expectInBoth(email, 'Chào Nguyễn Minh Anh,');
      expectInBoth(email, 'Kỹ sư Backend NestJS');
      for (const forbidden of [
        '91',
        'Thiếu NestJS',
        'overallScore',
        'rejectionReason',
      ]) {
        expect(email.html).not.toContain(forbidden);
        expect(email.text).not.toContain(forbidden);
      }
    }
  });

  it('every email ends with the automatic-email footer', () => {
    const fs = jest.requireActual<typeof import('fs')>('fs');
    const path = jest.requireActual<typeof import('path')>('path');
    const realLayout = fs.readFileSync(
      path.join(__dirname, '../../../assets/mail/notification-layout.html'),
      'utf8',
    );

    for (const { type } of cases) {
      const email = renderNotificationEmail(
        type,
        payloadForType(type),
        options,
      );

      expect(email.text.trim().slice(-footer.length)).toBe(footer);
      expect(email.html).not.toContain(footer);

      const emailWithRealLayout = renderNotificationEmail(
        type,
        payloadForType(type),
        { ...options, layout: realLayout },
      );

      expect(emailWithRealLayout.html.split(footer).length - 1).toBe(1);
      const greetingIndex = emailWithRealLayout.html.indexOf(
        'Chào Nguyễn Minh Anh,',
      );
      expect(greetingIndex).toBeGreaterThanOrEqual(0);
      expect(emailWithRealLayout.html.indexOf(footer)).toBeGreaterThan(
        greetingIndex,
      );
    }
  });
});
