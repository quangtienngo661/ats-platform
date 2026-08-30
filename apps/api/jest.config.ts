export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  // Both trees: `src/common/**` used to be silently excluded, so specs living
  // there (gemini, socket-io, pdf, storage, redis) never ran in `nx test api`
  // or in CI, and could rot unnoticed.
  testMatch: [
    '<rootDir>/src/app/**/*.spec.ts',
    '<rootDir>/src/common/**/*.spec.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  moduleNameMapper: {
    '^@ats-platform/database$':
      '<rootDir>/../../libs/backend/database/src/index.ts',
    '^@ats-platform/types$': '<rootDir>/../../libs/shared/types/src/index.ts',
  },
};
