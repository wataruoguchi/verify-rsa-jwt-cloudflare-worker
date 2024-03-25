/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  coverageProvider: 'v8',
  testEnvironment: 'miniflare',
  testEnvironmentOptions: {
    kvNamespaces: ['TEST_NAMESPACE'],
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};

module.exports = config;
