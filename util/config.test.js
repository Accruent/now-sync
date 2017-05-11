const {
  generateConfig,
  generateAuthConfig,
  parseConfigFile
} = require('./config');

jest.mock('fs');

describe('generateConfig', () => {
  test('sets the file path', () => {
    const mockFilePath = 'test/path';
    const config = generateConfig(mockFilePath);

    expect(config.filePath).toBe(mockFilePath);
  });
});

describe('generateAuthConfig', () => {
  test('sets the url and key', () => {
    const testUrl = 'https://test';
    const authConfig = generateAuthConfig(testUrl, 'user', 'pass');

    expect(authConfig.url).toBe(testUrl);
    expect(authConfig.key).toBeTruthy();
  });
});

describe('parseConfigFile', () => {
  test('isAuth flag loads the auth config file', () => {
    const authConfig = parseConfigFile(true);

    expect(authConfig.url).toBeTruthy();
    expect(authConfig.type).toBeTruthy();
    expect(authConfig.key).toBeTruthy();
  });
});
