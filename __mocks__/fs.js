const path = require('path');

const fs = jest.genMockFromModule('fs');
const realFs = require.requireActual('fs');
const { AUTH_FILE_PATH, CONFIG_FILE_PATH } = require('../constants');

function readFileSync(filePath) {
  if (filePath === AUTH_FILE_PATH) {
    return realFs.readFileSync(
      path.resolve(__dirname, '.now-sync-auth.yml'),
      'utf8'
    );
  } else if (filePath === CONFIG_FILE_PATH) {
    return realFs.readFileSync(
      path.resolve(__dirname, '.now-sync.yml'),
      'utf8'
    );
  }

  return 'Mock fs.readFileSync not configured for this path.';
}
fs.readFileSync = readFileSync;

function stat(filePath, cb) {
  cb(null, {
    mtime: new Date('2017-01-01T00:00:00.000Z')
  });
}
fs.stat = stat;

function writeFileSync() {}
fs.writeFileSync = writeFileSync;

module.exports = fs;
