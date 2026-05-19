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
  testMatch: ['<rootDir>/src/app/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  moduleNameMapper: {
    '^@ats-platform/database$': '<rootDir>/../../libs/backend/database/src/index.ts',
    '^@ats-platform/types$': '<rootDir>/../../libs/shared/types/src/index.ts',
  },
};
