jest.mock('fs');
jest.mock('./service-now');

const {
  generateFilesToWriteForRecord,
  getFieldValues
} = require('./add');
const { getRecord } = require('./service-now');

describe('getFieldValues', () => {
  test('replaces field `sys_scope` with `sys_scope.scope`', () => {
    const exampleTable = 'sys_script';
    const exampleSysId = '1234';
    const exampleScope = 'some_app_scope';

    getRecord.mockImplementation((table, sysId, fieldsToRetrieve) => {
      expect(fieldsToRetrieve.indexOf('sys_scope')).toBe(-1);
      expect(fieldsToRetrieve.indexOf('sys_scope.scope')).not.toBe(-1);
      expect(sysId).toBe(exampleSysId);

      return Promise.resolve({
        'sys_scope.scope': exampleScope
      });
    });

    getFieldValues(exampleTable, exampleSysId).then(record => {
      expect(record.sys_scope).toBe(exampleScope);
      expect(record['sys_scope.scope']).toBeUndefined();
    });
  });
});

describe('generateFilesToWriteForRecord', () => {
  const exampleTable = 'sp_widget';
  const examplefieldValues = {
    name: 'test_name',
    sys_id: 'test_sys_id',

    client_script: 'test_client_script',
    css: 'test_css',
    demo_data: 'test_demo_data',
    link: 'test_link',
    option_schema: 'test_option_schema',
    script: 'test_script',
    template: 'test_template'
  };

  const filesToWrite = generateFilesToWriteForRecord(exampleTable, examplefieldValues);

  test('creates a file object for each content field', () => {
    expect(filesToWrite.length).toBe(7);
  });
});

// describe('writeFilesForTable', () => {

// });

