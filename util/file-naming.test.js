const { compileFileName } = require('./file-naming');

describe('util/file-naming', () => {

  describe('compileFileName()', () => {
    test('correctly compiles file name from correct data', () => {
      const fileTemplate = ':name-script-:sys_id.js';
      const data = {
        sys_id: 'f224f2a51322fa00ca1e70a76144b072',
        name: 'x_ctv_sc.common',
        sys_updated_on: '2017-07-18 01:54:41',
        script: ''
      };

      expect(compileFileName(fileTemplate, data)).toEqual('x_ctv_sc.common-script-f224f2a51322fa00ca1e70a76144b072.js');
    });

    test('“-” in the record name is replaced with “^” in the file name', () => {
      const fileTemplate = ':name-script-:sys_id.js';
      const data = {
        sys_id: '1d58db6213233a00ca1e70a76144b090',
        name: 'x_ctv_dev.update-sets-release-tool',
        sys_updated_on: '2017-06-27 15:52:26',
        script: ''
      };

      expect(compileFileName(fileTemplate, data)).toEqual('x_ctv_dev.update^sets^release^tool-script-1d58db6213233a00ca1e70a76144b090.js');
    });

    test('“/” in the record name throws an error', () => {
      const fileTemplate = ':collection-:name-script-:sys_id.js';
      const data = {
        sys_id: '0df8452113044700ca1e70a76144b098',
        name: '_CTV_Re-Calculate Fees (ins/updt)',
        collection: 'x_ctv_sc_po_line_item',
        sys_updated_on: '2017-07-18 23:57:18',
        script: ''
      };

      let errorThrown = false;
      try {
        compileFileName(fileTemplate, data);
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(true);
    });

  });
});
