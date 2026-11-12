import { BankQuestion, reconcileSelection } from './question-selection';

const bank = (id: string, overrides: Partial<BankQuestion> = {}): BankQuestion => ({
  questionId: id,
  questionText: `Bank text ${id}`,
  expectedPoints: [`point of ${id}`],
  difficulty: 'medium',
  ...overrides,
});

const item = (overrides: Record<string, unknown> = {}) => ({
  questionText: 'Model text',
  expectedPoints: ['model point'],
  difficulty: 'hard' as const,
  ...overrides,
});

describe('reconcileSelection (C11, Review Focus 3)', () => {
  const retrieved = [bank('b1'), bank('b2'), bank('b3')];

  it('an id from the retrieved set is a bank question: the model\'s (lightly rewritten) text, the bank\'s points and difficulty', () => {
    const [draft] = reconcileSelection(
      [item({ bankQuestionId: 'b1', questionText: 'Rewritten b1' })],
      retrieved,
    );

    expect(draft).toEqual({
      questionText: 'Rewritten b1',
      expectedPoints: ['point of b1'],
      difficulty: 'medium',
      source: 'bank',
      bankQuestionId: 'b1',
    });
  });

  it('an id outside the retrieved set is generated and loses the id (the model invented or leaked it)', () => {
    const [draft] = reconcileSelection(
      [item({ bankQuestionId: 'from-another-topic' })],
      retrieved,
    );

    expect(draft).toEqual({
      questionText: 'Model text',
      expectedPoints: ['model point'],
      difficulty: 'hard',
      source: 'generated',
      bankQuestionId: null,
    });
  });

  it.each([[undefined], [null], ['']])('a missing id (%p) is generated', (bankQuestionId) => {
    const [draft] = reconcileSelection([item({ bankQuestionId })], retrieved);

    expect(draft.source).toBe('generated');
    expect(draft.bankQuestionId).toBeNull();
  });

  it('the same id twice: the first is bank, the second becomes generated with no id', () => {
    const drafts = reconcileSelection(
      [
        item({ bankQuestionId: 'b2', questionText: 'First use' }),
        item({ bankQuestionId: 'b2', questionText: 'Second use' }),
      ],
      retrieved,
    );

    expect(drafts.map((d) => [d.source, d.bankQuestionId, d.questionText])).toEqual([
      ['bank', 'b2', 'First use'],
      ['generated', null, 'Second use'],
    ]);
    // The duplicate keeps what the model wrote, not the bank's points.
    expect(drafts[1].expectedPoints).toEqual(['model point']);
  });

  it('a bank item with no usable text falls back to the bank\'s text', () => {
    const drafts = reconcileSelection(
      [item({ bankQuestionId: 'b3', questionText: '   ' }), item({ bankQuestionId: 'b1', questionText: undefined })],
      retrieved,
    );

    expect(drafts.map((d) => d.questionText)).toEqual(['Bank text b3', 'Bank text b1']);
  });

  it('keeps the model\'s order', () => {
    const drafts = reconcileSelection(
      [item({ bankQuestionId: 'b3' }), item(), item({ bankQuestionId: 'b1' })],
      retrieved,
    );

    expect(drafts.map((d) => d.bankQuestionId)).toEqual(['b3', null, 'b1']);
  });

  it('with nothing retrieved every item is generated', () => {
    const drafts = reconcileSelection([item({ bankQuestionId: 'b1' }), item()], []);

    expect(drafts.every((d) => d.source === 'generated' && d.bankQuestionId === null)).toBe(true);
  });

  it('does not mutate what it is given', () => {
    const input = [item({ bankQuestionId: 'b1' })];
    const snapshot = JSON.stringify(input);

    reconcileSelection(input, retrieved);

    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
