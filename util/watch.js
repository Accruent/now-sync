const _ = require('lodash');
const chalk = require('chalk');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const { getFieldValuesFromFileName } = require('./file-naming');
const { parseConfigFile, saveConfigFile } = require('./config');
const { updateRecord } = require('./service-now');

const readFileAsync = Promise.promisify(fs.readFile);

/**
 * Watches the configured directory for any file changes and updates the related ServiceNow record.
 *
 * When a file changes, the sync’d ServiceNow record’s field is updated with the file contents.
 * When a file is deleted, the file is removed from the .now-sync.yml configuration file.
 *
 * @returns {chokidar} A chokidar watcher instance
 */
function watch() {
  let config = parseConfigFile();
  const dir = path.resolve(process.cwd(), config.filePath);

  const watcher = chokidar.watch(dir, {
    awaitWriteFinish: true,
    ignored: /(^|[/\\])\../ // dotfiles
  });

  watcher.on('ready', () => {
    console.log(`Watching ${config.filePath} for changes...`); // eslint-disable-line no-console
  });

  // Used for storing the file’s mtime (last modified time) before changes are made.
  // This is so we can compare whether the ServiceNow record was updated before the
  // user made their latest change.
  const fileStats = {};

  watcher.on('add', (watchPath, stats) => {
    config = parseConfigFile();
    fileStats[watchPath] = stats;
  });

  watcher.on('change', (watchPath, stats) => {
    const relativePath = watchPath.substr(dir.length + 1).split('/');
    const table = relativePath[0];
    const file = relativePath[1];

    const fileConfig = _.find(
      config.records[table],
      record => record.fileName === file
    );
    if (!fileConfig) {
      // eslint-disable-next-line no-console
      console.error(
        chalk.red(
          `Could not find a file configuration matching table record on ${table}: ${file}. Make sure that configuration exists in your .now-sync.yml file. If it does not exist, run \`now add\` to add the file configuration.`
        )
      );

      return;
    }

    const { contentField } = fileConfig;
    const { fileName: fileTemplate } = _.find(
      config.config[table].formats,
      format => format.contentField === contentField
    );
    const fieldValues = getFieldValuesFromFileName(file, fileTemplate);

    readFileAsync(watchPath, 'utf8')
      .then(fileContents => {
        const uploadBody = {};
        uploadBody[contentField] = fileContents;

        return updateRecord(table, fieldValues.sys_id, uploadBody);
      })
      .then(() => {
        fileStats[watchPath] = stats;
      });
  });

  watcher.on('unlink', watchPath => {
    delete fileStats[watchPath];
    config = parseConfigFile();

    const relativePath = watchPath.substr(dir.length + 1).split('/');
    const table = relativePath[0];
    const file = relativePath[1];

    const configRecords = config.records[table];
    const configRecordIndex = _.findIndex(
      configRecords,
      record => record.fileName === file
    );

    if (configRecordIndex > -1) {
      configRecords.splice(configRecordIndex, 1);

      saveConfigFile(config);
      console.log(`Removed "${table}/${file}" from now-sync config.`); // eslint-disable-line no-console
    }
  });

  return watcher;

  //////
}
exports.watch = watch;
