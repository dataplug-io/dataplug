module.exports = {
  preset: 'ts-jest',
  setupFiles: [ './testSetup/globalSetup.ts' ],
  clearMocks: true,
  coverageDirectory: 'tests/coverage',
  testEnvironment: 'node',
};
