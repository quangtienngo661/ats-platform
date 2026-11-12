import { NotFoundException } from '@nestjs/common';
import { createPrismaMock } from '../../../test-utils/unit-test-helpers';
import { InterviewQuestionsService } from './interview-questions.service';

describe('InterviewQuestionsService (C10)', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let embeddingQueue: { enqueue: jest.Mock };
  let service: InterviewQuestionsService;

  const stored = (overrides: Record<string, unknown> = {}) => ({
    questionId: 'q-1',
    topicId: 'topic-1',
    difficulty: 'medium',
    questionText: 'REST là gì?',
    expectedPoints: ['Stateless'],
    isActive: true,
    createdById: 'admin-1',
    ...overrides,
  });

  beforeEach(() => {
    prisma = createPrismaMock();
    embeddingQueue = { enqueue: jest.fn().mockResolvedValue(undefined) };
    prisma.interviewTopic.findUnique.mockResolvedValue({ topicId: 'topic-1' });
    prisma.interviewQuestion.create.mockImplementation(async ({ data }) => stored({ ...data }));
    prisma.interviewQuestion.update.mockImplementation(async ({ data }) => stored({ ...data }));
    service = new InterviewQuestionsService(prisma as never, embeddingQueue as never);
  });

  describe('create', () => {
    const dto = {
      difficulty: 'medium' as const,
      questionText: '  REST là gì?  ',
      expectedPoints: ['Stateless', ' Cacheable '],
    };

    it('saves the question under the topic with the admin as author, trimmed, then queues its embedding', async () => {
      prisma.interviewQuestion.create.mockResolvedValue(stored({ questionId: 'q-new' }));

      await service.create('topic-1', dto, 'admin-1');

      expect(prisma.interviewQuestion.create).toHaveBeenCalledWith({
        data: {
          topicId: 'topic-1',
          difficulty: 'medium',
          questionText: 'REST là gì?',
          expectedPoints: ['Stateless', 'Cacheable'],
          createdById: 'admin-1',
        },
      });
      expect(embeddingQueue.enqueue).toHaveBeenCalledWith('interview_question', 'q-new');
      expect(prisma.interviewQuestion.create.mock.invocationCallOrder[0]).toBeLessThan(
        embeddingQueue.enqueue.mock.invocationCallOrder[0],
      );
    });

    it('an unknown topic is 404 "Không tìm thấy chủ đề phỏng vấn" and saves nothing', async () => {
      prisma.interviewTopic.findUnique.mockResolvedValue(null);

      await expect(service.create('nope', dto, 'admin-1')).rejects.toThrow(
        new NotFoundException('Không tìm thấy chủ đề phỏng vấn'),
      );

      expect(prisma.interviewQuestion.create).not.toHaveBeenCalled();
      expect(embeddingQueue.enqueue).not.toHaveBeenCalled();
    });

    it('a queue failure does not fail or undo the save', async () => {
      prisma.interviewQuestion.create.mockResolvedValue(stored({ questionId: 'q-new' }));
      embeddingQueue.enqueue.mockRejectedValue(new Error('redis down'));

      await expect(service.create('topic-1', dto, 'admin-1')).resolves.toEqual(
        expect.objectContaining({ questionId: 'q-new' }),
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.interviewQuestion.findUnique.mockResolvedValue(stored());
    });

    it('update without text change does not enqueue', async () => {
      await service.update('q-1', { difficulty: 'hard', expectedPoints: ['New point'] });

      expect(prisma.interviewQuestion.update).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
        data: { difficulty: 'hard', expectedPoints: ['New point'] },
      });
      expect(embeddingQueue.enqueue).not.toHaveBeenCalled();
    });

    it('sending the same text (even with other spacing) is not a text change', async () => {
      await service.update('q-1', { questionText: '  REST là gì?  ' });

      expect(embeddingQueue.enqueue).not.toHaveBeenCalled();
    });

    it('a changed text is saved trimmed and queued for embedding again', async () => {
      await service.update('q-1', { questionText: '  GraphQL là gì?  ' });

      expect(prisma.interviewQuestion.update).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
        data: { questionText: 'GraphQL là gì?' },
      });
      expect(embeddingQueue.enqueue).toHaveBeenCalledWith('interview_question', 'q-1');
    });

    it('hiding and showing change only isActive', async () => {
      await service.update('q-1', { isActive: false });

      expect(prisma.interviewQuestion.update).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
        data: { isActive: false },
      });
      expect(embeddingQueue.enqueue).not.toHaveBeenCalled();
    });

    it('an unknown question is 404 "Không tìm thấy câu hỏi phỏng vấn"', async () => {
      prisma.interviewQuestion.findUnique.mockResolvedValue(null);

      await expect(service.update('nope', { isActive: false })).rejects.toThrow(
        new NotFoundException('Không tìm thấy câu hỏi phỏng vấn'),
      );

      expect(prisma.interviewQuestion.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('delete sets isActive false and keeps the row', async () => {
      prisma.interviewQuestion.findUnique.mockResolvedValue(stored());

      await service.remove('q-1');

      expect(prisma.interviewQuestion.update).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
        data: { isActive: false },
      });
      expect(prisma.interviewQuestion.delete).not.toHaveBeenCalled();
    });

    it('an unknown question is 404', async () => {
      prisma.interviewQuestion.findUnique.mockResolvedValue(null);

      await expect(service.remove('nope')).rejects.toThrow('Không tìm thấy câu hỏi phỏng vấn');
    });
  });

  describe('list', () => {
    beforeEach(() => {
      prisma.interviewQuestion.findMany.mockResolvedValue([stored()]);
      prisma.interviewQuestion.count.mockResolvedValue(45);
    });

    it('lists the active questions of a topic with pagination', async () => {
      const result = await service.list('topic-1', { page: 2, limit: 20 });

      expect(prisma.interviewQuestion.findMany).toHaveBeenCalledWith({
        where: { topicId: 'topic-1', isActive: true },
        orderBy: [{ difficulty: 'asc' }, { createdAt: 'desc' }],
        skip: 20,
        take: 20,
      });
      expect(result).toEqual({
        items: [stored()],
        pagination: { page: 2, limit: 20, total: 45, totalPages: 3 },
      });
    });

    it('filters by difficulty and can include the hidden ones', async () => {
      await service.list('topic-1', { difficulty: 'hard', includeInactive: true });

      expect(prisma.interviewQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { topicId: 'topic-1', difficulty: 'hard' } }),
      );
    });

    it('defaults to page 1 with 20 per page', async () => {
      const result = await service.list('topic-1', {});

      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 45, totalPages: 3 });
    });

    it('an unknown topic is 404', async () => {
      prisma.interviewTopic.findUnique.mockResolvedValue(null);

      await expect(service.list('nope', {})).rejects.toThrow('Không tìm thấy chủ đề phỏng vấn');
    });
  });
});
