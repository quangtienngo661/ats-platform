type ModelMock = Record<string, jest.Mock>;

const model = (methods: string[]): ModelMock =>
  methods.reduce((acc, method) => {
    acc[method] = jest.fn();
    return acc;
  }, {} as ModelMock);

export const createPrismaMock = () => ({
  $transaction: jest.fn(async (input: any) => {
    if (Array.isArray(input)) {
      return Promise.all(input);
    }
    return input(createPrismaTransactionMock());
  }),
  aiConfig: model(['create', 'findMany', 'findUnique', 'findFirst', 'update', 'updateMany', 'delete']),
  aiUsageLog: model(['create', 'findMany', 'count']),
  application: model(['create', 'findMany', 'findUnique', 'count', 'update']),
  applicationHistory: model(['create', 'findMany']),
  candidate: model(['create', 'findFirst', 'findMany', 'findUnique', 'count', 'update']),
  cV: model(['create', 'findMany', 'findUnique', 'delete']),
  cVParsedData: model(['create', 'update']),
  cVScreening: model(['count', 'findMany', 'findUnique', 'upsert']),
  department: model(['create', 'findMany', 'findUnique', 'update', 'delete']),
  interviewQnA: model(['createMany', 'findFirst', 'findMany', 'findUnique', 'update']),
  interviewResult: model(['findUnique', 'upsert']),
  interviewSchedule: model(['create', 'count', 'delete', 'findFirst', 'findMany', 'findUnique', 'update']),
  interviewSession: model(['create', 'findFirst', 'findMany', 'findUnique', 'update']),
  interviewTopic: model(['create', 'delete', 'findMany', 'findUnique', 'update']),
  jobCategory: model(['create', 'delete', 'findMany', 'findUnique', 'update']),
  jobPosting: model(['create', 'count', 'delete', 'findMany', 'findUnique', 'update']),
  jobPostingSkill: model(['createMany', 'deleteMany']),
  notification: model(['count', 'create', 'delete', 'findMany', 'findUnique', 'update', 'updateMany']),
  recruiter: model(['create', 'delete', 'findMany', 'findUnique', 'update']),
  refreshToken: model(['create', 'findUnique', 'update', 'updateMany']),
  skill: model(['create', 'delete', 'findMany', 'findUnique', 'update']),
  user: model(['create', 'delete', 'findMany', 'findUnique', 'update']),
});

export const createPrismaTransactionMock = () => {
  const tx = createPrismaMock();
  tx.$transaction = jest.fn();
  return tx;
};

export const createQueueMock = () => ({
  add: jest.fn(),
  setGlobalRateLimit: jest.fn(),
});

export const createSocketMock = () => ({
  handleEmit: jest.fn(),
});

export const createJwtMock = () => ({
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
});

export const createRedisMock = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
});

export const mockRequest = (user: Record<string, any> = {}, cookies: Record<string, any> = {}) =>
  ({
    user,
    cookies,
  } as any);

export const mockResponse = () =>
  ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
    download: jest.fn(),
  } as any);
