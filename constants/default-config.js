const _ = require('lodash');
const FILE_CONFIGS = require('./file-configs');

const defaultConfig = {
  config: {},
  filePath: '',
  records: {}
};

_.forEach(FILE_CONFIGS, (configObj, tableName) => {
  defaultConfig.config[tableName] = configObj;

  if (!defaultConfig.records[tableName]) {
    defaultConfig.records[tableName] = [];
  }
});

module.exports = defaultConfig;
