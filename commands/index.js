const config = require('./config');
const addTable = require('./add-table');
const add = require('./add');
// const del = require('./delete');
const info = require('./info');
// const list = require('./list');
const pull = require('./pull');
const push = require('./push');
const sync = require('./sync');
const watch = require('./watch');

module.exports = {
  config: {
    command: ['config', 'init', 'c'],
    describe: 'Initiates config for current folder (run this first)',
    options: {
      host: {
        alias: 'h',
        describe: 'ServiceNow instance URL (include the `https://`)',
        type: 'string'
      },
      user: {
        alias: 'u',
        describe: 'User name',
        type: 'string'
      },
      password: {
        alias: 'p',
        describe: 'Password',
        type: 'string'
      },
      filepath: {
        alias: 'f',
        describe: 'Folder to store ServiceNow files',
        default: './now',
        type: 'string'
      }
    },
    CommandClass: config
  },
  // delete: {
  //   describe: 'Removes file from ServiceNow and project folder',
  //   CommandClass: del
  // },
  info: {
    command: ['info', 'i'],
    describe: 'Lists information about ServiceNow instance',
    CommandClass: info
  },
  // list: {
  //   describe: 'Lists all records of a record type sync’d in project folder with ServiceNow',
  //   CommandClass: list
  // },
  'add:table': {
    command: 'add:table', // TODO: [options, ]
    describe: 'Add a new table configuration to sync with local files',
    CommandClass: addTable
  },
  add: {
    command: ['add', 'a'],
    describe: 'Add record files to sync with a ServiceNow record',
    options: {
      table: {
        alias: 't',
        describe: 'Table API name',
        type: 'string'
      },
      id: {
        alias: 'i',
        describe: 'Record sys_id',
        type: 'string'
      }
    },
    CommandClass: add
  },
  pull: {
    command: 'pull',
    describe:
      'Overwrites all local file content with synced ServiceNow record content',
    CommandClass: pull
  },
  push: {
    command: 'push',
    describe:
      'Overwrites all synced ServiceNow record fields with local file content',
    CommandClass: push
  },
  sync: {
    command: 'sync',
    alias: 's',
    describe:
      '!DANGER! Perform a one-time sync on all synced local files with ServiceNow records',
    CommandClass: sync
  },
  watch: {
    command: 'watch',
    alias: 'w',
    describe:
      'Watches project folder files for changes and pushes changes to ServiceNow',
    CommandClass: watch
  }
};
