import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateInterviewQuestionDto,
  ListInterviewQuestionsQueryDto,
  UpdateInterviewQuestionDto,
} from './interview-question.dto';

const base = {
  difficulty: 'medium',
  questionText: 'Giải thích sự khác nhau giữa REST và GraphQL?',
  expectedPoints: ['Cách truy vấn dữ liệu', 'Số endpoint'],
};

const errorsOf = <T extends object>(cls: new () => T, payload: Record<string, unknown>) =>
  validate(plainToInstance(cls, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('CreateInterviewQuestionDto', () => {
  it('accepts a complete question', async () => {
    await expect(errorsOf(CreateInterviewQuestionDto, base)).resolves.toEqual([]);
  });

  it.each(['easy', 'medium', 'hard'])('accepts difficulty %s', async (difficulty) => {
    await expect(
      errorsOf(CreateInterviewQuestionDto, { ...base, difficulty }),
    ).resolves.toEqual([]);
  });

  it.each([
    ['difficulty', 'impossible', 'isEnum'],
    ['difficulty', undefined, 'isEnum'],
    ['questionText', '', 'isNotEmpty'],
    ['questionText', '   ', 'isNotEmpty'],
    ['questionText', undefined, 'isNotEmpty'],
    ['questionText', 'a'.repeat(1001), 'maxLength'],
    ['expectedPoints', [], 'arrayMinSize'],
    ['expectedPoints', undefined, 'isArray'],
    ['expectedPoints', 'a point', 'isArray'],
    ['expectedPoints', Array.from({ length: 21 }, (_, i) => `p${i}`), 'arrayMaxSize'],
    ['expectedPoints', ['ok', ''], 'isNotEmpty'],
    ['expectedPoints', ['ok', 3], 'isString'],
    ['expectedPoints', ['x'.repeat(501)], 'maxLength'],
  ])('rejects %s = %p with %s', async (field, value, constraint) => {
    const payload: Record<string, unknown> = { ...base };
    if (value === undefined) delete payload[field];
    else payload[field] = value;

    const errors = await errorsOf(CreateInterviewQuestionDto, payload);

    expect(errors).toEqual([expect.objectContaining({ property: field })]);
    const flat = JSON.stringify(errors);
    expect(flat).toContain(constraint);
  });

  it('rejects fields it does not know (the client cannot set the author or the embedding)', async () => {
    const errors = await errorsOf(CreateInterviewQuestionDto, {
      ...base,
      createdById: 'someone',
      embedding: [1],
      isActive: false,
    });

    expect(errors.map((e) => e.property).sort()).toEqual([
      'createdById',
      'embedding',
      'isActive',
    ]);
  });
});

describe('UpdateInterviewQuestionDto', () => {
  it('accepts any subset, including isActive', async () => {
    await expect(errorsOf(UpdateInterviewQuestionDto, {})).resolves.toEqual([]);
    await expect(
      errorsOf(UpdateInterviewQuestionDto, { isActive: false }),
    ).resolves.toEqual([]);
    await expect(
      errorsOf(UpdateInterviewQuestionDto, { questionText: 'Mới', difficulty: 'hard' }),
    ).resolves.toEqual([]);
  });

  it('still validates what it is given', async () => {
    const errors = await errorsOf(UpdateInterviewQuestionDto, {
      expectedPoints: [],
      isActive: 'yes',
    });

    expect(errors.map((e) => e.property).sort()).toEqual(['expectedPoints', 'isActive']);
  });
});

describe('ListInterviewQuestionsQueryDto', () => {
  it('turns query strings into the right types', async () => {
    const dto = plainToInstance(ListInterviewQuestionsQueryDto, {
      difficulty: 'hard',
      includeInactive: 'true',
      page: '2',
      limit: '50',
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.includeInactive).toBe(true);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('includeInactive "false" really is false', () => {
    const dto = plainToInstance(ListInterviewQuestionsQueryDto, {
      includeInactive: 'false',
    });

    expect(dto.includeInactive).toBe(false);
  });

  it.each([
    { difficulty: 'nope' },
    { page: '0' },
    { limit: '101' },
    { includeInactive: 'maybe' },
  ])('rejects %p', async (query) => {
    const errors = await validate(plainToInstance(ListInterviewQuestionsQueryDto, query));

    expect(errors.length).toBeGreaterThan(0);
  });
});
