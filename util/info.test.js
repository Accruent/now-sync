jest.mock('fs');
jest.mock('./api');

const { getInstanceVersion } = require('./info');
const { get } = require('./api');

describe('getInstanceVersion', () => {
  get.mockImplementation(
    () =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            result: [{ value: 'test_version' }]
          });
        }, 25);
      })
  );
  const instanceVersionPromise = getInstanceVersion();

  test('retrieves version', () => {
    instanceVersionPromise.then(response => {
      expect(response.version).toBe('test_version');
    });
  });

  test('calculates latency', () => {
    instanceVersionPromise.then(response => {
      expect(response.latency).toBe('25ms');
    });
  });
});
