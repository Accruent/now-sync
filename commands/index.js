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
    description: 'Initiates config for current folder (run this first)',
    command: config
  },
  // delete: {
  //   description: 'Removes file from ServiceNow and project folder',
  //   command: del
  // },
  info: {
    description: 'Lists information about ServiceNow instance',
    command: info
  },
  // list: {
  //   description: 'Lists all records of a record type sync’d in project folder with ServiceNow',
  //   command: list
  // },
  'add:table': {
    description: 'Add a new table configuration to sync with local files',
    command: addTable
  },
  add: {
    description: 'Add record files to sync with a ServiceNow record',
    command: add
  },
  pull: {
    description:
      'Overwrites all local file content with synced ServiceNow record content',
    command: pull
  },
  push: {
    description:
      'Overwrites all synced ServiceNow record fields with local file content',
    command: push
  },
  sync: {
    description:
      '!DANGER! Perform a one-time sync on all synced local files with ServiceNow records',
    command: sync
  },
  watch: {
    description:
      'Watches project folder files for changes and pushes changes to ServiceNow',
    command: watch
  }
};
