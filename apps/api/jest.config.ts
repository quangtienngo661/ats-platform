export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] },
    ],
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(htmlparser2|domhandler|domutils|dom-serializer|entities|domelementtype|launder)/)',
  ],
  // Both trees: `src/common/**` used to be silently excluded, so specs living
  // there (gemini, socket-io, pdf, storage, redis) never ran in `nx test api`
  // or in CI, and could rot unnoticed.
  testMatch: [
    '<rootDir>/src/app/**/*.spec.ts',
    '<rootDir>/src/common/**/*.spec.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  // Include untouched production files; imported files alone overstate coverage.
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/test-utils/**',
    '!<rootDir>/src/main.ts',
  ],
  moduleNameMapper: {
    '^@ats-platform/database$':
      '<rootDir>/../../libs/backend/database/src/index.ts',
    '^@ats-platform/types$': '<rootDir>/../../libs/shared/types/src/index.ts',
  },
};
