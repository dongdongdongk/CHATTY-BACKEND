import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  coverageDirectory: 'coverage',
  collectCoverage: true,
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  testMatch: ['<rootDir>/src/**/test/*.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/test/*.ts?(x)', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
      lines: 1,
      statements: 1
    }
  },
  coverageReporters: ['text-summary', 'lcov'],
  moduleNameMapper: {
    '@auth/(.*)':['<rootDir>/src/features/auth/$1'],
    '@user/(.*)':['<rootDir>/src/features/user/$1'],
    '@global/(.*)':['<rootDir>/src/features/global/$1'],
    '@service/(.*)':['<rootDir>/src/features/service/$1'],
    '@socket/(.*)':['<rootDir>/src/features/socket/$1'],
    '@worker/(.*)':['<rootDir>/src/features/worker/$1'],
    '@root/(.*)':['<rootDir>/src/$1']
  }
};

export default config;
