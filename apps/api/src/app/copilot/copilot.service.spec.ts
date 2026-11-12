import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CopilotDecisionType, UserRole } from '@ats-platform/database';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';
import { CopilotService } from './copilot.service';

const NOW = new Date('2026-11-20T03:00:00.000Z');
const SINCE = new Date('2026-11-18T03:00:00.000Z');
const recruiter = callerOf(UserRole.recruiter, { userId: 'rec-user-1' });

const row = (overrides: Record<string, unknown> = {}) => ({
  applicationId: 'app-1',
  organizationId: 'org-1',
  status: 'screening',
  currentStageSince: SINCE,
  screening: {
    status: 'completed',
    overallScore: '78.0',
    skillsScore: '80.0',
    experienceScore: '75.0',
    educationScore: '70.0',
    reviewedAt: null,
    reviewedOverallScore: null,
    reviewedSkillsScore: null,
    reviewedExperienceScore: null,
    reviewedEducationScore: null,
    aiConfig: { minimumScoreThreshold: '60' },
  },
  schedules: [],
  ...overrides,
});
const INVITE_KEY = `invite_interview:screening:${SINCE.toISOString()}`;

describe('CopilotService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let applications: {
    assertCanAccessDepartment: jest.Mock;
    assertCanAccessApplication: jest.Mock;
    updateStatus: jest.Mock;
    triggerScreening: jest.Mock;
  };
  let llm: { explainSuggestion: jest.Mock };
  let service: CopilotService;

  beforeEach(() => {
    prisma = createPrismaMock();
    applications = {
      assertCanAccessDepartment: jest.fn().mockResolvedValue(undefined),
      assertCanAccessApplication: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue({ applicationId: 'app-1', status: 'interview' }),
      triggerScreening: jest.fn().mockResolvedValue({ screeningId: 'scr-1' }),
    };
    llm = { explainSuggestion: jest.fn() };
    service = new CopilotService(prisma as any, applications as any, llm as any);
    prisma.application.findUnique.mockResolvedValue(row());
    prisma.copilotDecision.findMany.mockResolvedValue([]);
    prisma.copilotDecision.create.mockResolvedValue({});
  });

  describe('suggestionsForJob (R11)', () => {
    beforeEach(() => {
      prisma.jobPosting.findUnique.mockResolvedValue({ organizationId: 'org-1', departmentId: 'dep-1' });
      prisma.application.findMany.mockResolvedValue([
        row(),
        row({ applicationId: 'app-2', status: 'hired' }),
      ]);
    });

    it('checks the Kanban scope of the job, then returns one suggestion per application that has one', async () => {
      const result = await service.suggestionsForJob(recruiter, 'job-1', NOW);

      expect(applications.assertCanAccessDepartment).toHaveBeenCalledWith(recruiter, {
        organizationId: 'org-1',
        departmentId: 'dep-1',
      });
      expect(Object.keys(result)).toEqual(['app-1']);
      expect(result['app-1']).toEqual(expect.objectContaining({ ruleId: 'invite_interview', key: INVITE_KEY }));
    });

    it('leaves out a suggestion dismissed with the same key, keeps one dismissed under an older key (R13, C10)', async () => {
      prisma.copilotDecision.findMany.mockResolvedValue([
        { applicationId: 'app-1', suggestionKey: INVITE_KEY },
      ]);
      expect(await service.suggestionsForJob(recruiter, 'job-1', NOW)).toEqual({});

      prisma.copilotDecision.findMany.mockResolvedValue([
        { applicationId: 'app-1', suggestionKey: 'invite_interview:screening:2026-11-01T00:00:00.000Z' },
      ]);
      expect(Object.keys(await service.suggestionsForJob(recruiter, 'job-1', NOW))).toEqual(['app-1']);
    });

    it('refuses a caller outside the job’s department before reading any application', async () => {
      applications.assertCanAccessDepartment.mockRejectedValue(new ForbiddenException());

      await expect(service.suggestionsForJob(recruiter, 'job-1', NOW)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.application.findMany).not.toHaveBeenCalled();
    });
  });

  describe('apply (R12, C9)', () => {
    it('moves the application through updateStatus and records who accepted what', async () => {
      prisma.application.findUnique
        .mockResolvedValueOnce(row())
        .mockResolvedValueOnce({ applicationId: 'app-1', status: 'interview' });

      const result = await service.apply(recruiter, 'app-1', INVITE_KEY, NOW);

      expect(applications.updateStatus).toHaveBeenCalledWith('app-1', recruiter, {
        status: 'interview',
        notes: 'Áp dụng gợi ý co-pilot: Mời phỏng vấn',
      });
      expect(prisma.copilotDecision.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          applicationId: 'app-1',
          ruleId: 'invite_interview',
          suggestionKey: INVITE_KEY,
          decision: CopilotDecisionType.accepted,
          decidedById: 'rec-user-1',
        },
      });
      expect(result).toEqual({ applied: 'invite_interview', application: { applicationId: 'app-1', status: 'interview' } });
    });

    it('runs the AI screening for a screening that is missing', async () => {
      prisma.application.findUnique.mockResolvedValue(row({ screening: null }));

      await service.apply(recruiter, 'app-1', `screening_missing:screening:${SINCE.toISOString()}`, NOW);

      expect(applications.triggerScreening).toHaveBeenCalledWith('app-1', recruiter);
      expect(applications.updateStatus).not.toHaveBeenCalled();
    });

    it('a stale key is 409 and changes nothing (E4)', async () => {
      const call = service.apply(recruiter, 'app-1', 'invite_interview:screening:2026-11-01T00:00:00.000Z', NOW);

      await expect(call).rejects.toBeInstanceOf(ConflictException);
      await expect(call).rejects.toThrow('Gợi ý đã thay đổi. Tải lại trang để xem gợi ý mới.');
      expect(applications.updateStatus).not.toHaveBeenCalled();
      expect(prisma.copilotDecision.create).not.toHaveBeenCalled();
    });

    it('a suggestion that only opens the profile cannot be applied (400), nothing recorded', async () => {
      prisma.application.findUnique.mockResolvedValue(
        row({ screening: { ...row().screening, overallScore: '40.0' } }),
      );

      const call = service.apply(recruiter, 'app-1', `below_threshold:screening:${SINCE.toISOString()}`, NOW);

      await expect(call).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.copilotDecision.create).not.toHaveBeenCalled();
    });

    it('a caller outside the scope is refused before anything is read', async () => {
      applications.assertCanAccessApplication.mockRejectedValue(new ForbiddenException());

      await expect(service.apply(recruiter, 'app-1', INVITE_KEY, NOW)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.application.findUnique).not.toHaveBeenCalled();
    });

    it('a failed status change records no acceptance', async () => {
      applications.updateStatus.mockRejectedValue(new BadRequestException('FSM'));

      await expect(service.apply(recruiter, 'app-1', INVITE_KEY, NOW)).rejects.toThrow('FSM');
      expect(prisma.copilotDecision.create).not.toHaveBeenCalled();
    });
  });

  describe('dismiss (R13)', () => {
    it('records the dismissal under the current key', async () => {
      await expect(service.dismiss(recruiter, 'app-1', INVITE_KEY, NOW)).resolves.toEqual({ dismissed: 'invite_interview' });
      expect(prisma.copilotDecision.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ decision: CopilotDecisionType.dismissed, suggestionKey: INVITE_KEY }),
      });
    });
  });

  describe('explain (R14, C11)', () => {
    it('returns the explanation the LLM wrote from the facts the rules decided', async () => {
      llm.explainSuggestion.mockResolvedValue({ explanation: '  Điểm 78 cao hơn ngưỡng 60.  ' });

      await expect(service.explain(recruiter, 'app-1', NOW)).resolves.toEqual({ explanation: 'Điểm 78 cao hơn ngưỡng 60.' });
      const [refId, content, organizationId] = llm.explainSuggestion.mock.calls[0];
      expect(refId).toBe('app-1');
      expect(organizationId).toBe('org-1'); // the cost view counts it for this organization (R20)
      expect(JSON.parse(content)).toEqual({
        status: 'screening',
        suggestion: { title: 'Mời phỏng vấn', reasons: ['Điểm sàng lọc 78 (AI), ngưỡng 60.'] },
      });
      expect(prisma.copilotDecision.create).not.toHaveBeenCalled();
    });

    it.each([
      ['the LLM fails', () => llm.explainSuggestion.mockRejectedValue(new Error('RESOURCE_EXHAUSTED'))],
      ['the LLM returns no text', () => llm.explainSuggestion.mockResolvedValue({ explanation: '' })],
    ])('answers 503 when %s', async (_label, arrange) => {
      arrange();

      const call = service.explain(recruiter, 'app-1', NOW);
      await expect(call).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(call).rejects.toThrow('Chưa tạo được giải thích, hãy dùng các lý do bên dưới.');
    });

    it('has nothing to explain for an application without a suggestion', async () => {
      prisma.application.findUnique.mockResolvedValue(row({ status: 'hired' }));

      await expect(service.explain(recruiter, 'app-1', NOW)).rejects.toBeInstanceOf(BadRequestException);
      expect(llm.explainSuggestion).not.toHaveBeenCalled();
    });
  });
});
