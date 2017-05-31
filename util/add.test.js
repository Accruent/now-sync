jest.mock('fs');
jest.mock('./service-now');

const moment = require('moment');
const {
  generateFilesToWriteForRecord,
  getFieldValues
} = require('./add');
const { convertServiceNowDatetimeToMoment, getRecord } = require('./service-now');

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

  test('replaces field `web_service_definition` with `web_service_definition.service_id`', () => {
    const exampleTable = 'sys_ws_operation';
    const exampleSysId = '1234';
    const wsDef = 'some_ws_definition';

    getRecord.mockImplementation((table, sysId, fieldsToRetrieve) => {
      expect(fieldsToRetrieve.indexOf('web_service_definition')).toBe(-1);
      expect(fieldsToRetrieve.indexOf('web_service_definition.service_id')).not.toBe(-1);
      expect(sysId).toBe(exampleSysId);

      return Promise.resolve({
        name: 'test',
        'web_service_definition.service_id': wsDef
      });
    });

    getFieldValues(exampleTable, exampleSysId).then(record => {
      expect(record.web_service_definition).toBe(wsDef);
      expect(record['web_service_definition.service_id']).toBeUndefined();
    });
  });
});

describe('generateFilesToWriteForRecord', () => {
  const exampleTable = 'sp_widget';
  const examplefieldValues = {
    name: 'test_name',
    sys_id: 'test_sys_id',
    sys_updated_on: '2017-01-01 12:00:00',

    client_script: 'test_client_script',
    css: 'test_css',
    demo_data: 'test_demo_data',
    link: 'test_link',
    option_schema: 'test_option_schema',
    script: 'test_script',
    template: 'test_template'
  };

  convertServiceNowDatetimeToMoment.mockImplementation(() => moment());

  test('creates a file object for each content field', () => {
    jest.unmock('./service-now');
    const filesToWrite = generateFilesToWriteForRecord(exampleTable, examplefieldValues);
    expect(filesToWrite.length).toBe(7);
  });
});

// describe('writeFilesForTable', () => {

// });

