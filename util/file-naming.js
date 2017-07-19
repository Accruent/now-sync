const _ = require('lodash');
const pathToRegexp = require('path-to-regexp');
const { parseConfigFile } = require('./config');

// characters found in the record name that will be replaced
const replaceFileNameRe = [
  { toReplace: new RegExp('-', 'g'), replaceWith: '^' }
  // { toReplace: new RegExp('/', 'g'), replaceWith: '%' } // throwing an error instead
];

// characters found in the record name that will throw an error
const errorFileNameRe = [
  /\//g
];

/**
 * Compiles a now-sync file name using a given file template and record data.
 *
 * @param {string} fileTemplate A pathToRegexp string
 * @param {object} data A field:value hash representing record data
 * @returns {string} The compiled file name.
 */
function compileFileName(fileTemplate, data) {
  const tokens = pathToRegexp.parse(fileTemplate, { delimiter: '-' });
  const fileNameFragments = _.map(tokens, token => {
    if (typeof token === 'string') {
      return token;
    }

    let tokenFromData = data[token.name];
    let i;
    for (i = 0; i < errorFileNameRe.length; i++) {
      const errorFileNameReExec = errorFileNameRe[i].exec(tokenFromData);
      if (errorFileNameReExec) {
        throw new Error(`Invalid character "${errorFileNameReExec[0]}" found in the record’s \`${token.name}\` field. Change your record’s \`${token.name}\` field value and try again.`);
      }
    }

    for (i = 0; i < replaceFileNameRe.length; i++) {
      const replaceChar = replaceFileNameRe[i];

      if (replaceChar.toReplace.test(tokenFromData)) {
        tokenFromData = tokenFromData.replace(replaceChar.toReplace, replaceChar.replaceWith);
      }
    }
    return tokenFromData;
  });

  return fileNameFragments.join('');
}
exports.compileFileName = compileFileName;

/**
 * Retrieves all record fields used for naming files for a specific table.
 *
 * @param {string} table ServiceNow Table’s API name
 * @example
 * Given the config for table `sp_widget` (in the `.now-sync` config file):
 *  nameField: name
 *  formats:
 *    - fileName: ':name-client_script-:sys_id.js'
 *      contentField: client_script
 *    - fileName: ':name-css-:sys_id.css'
 *      contentField: css
 *    - fileName: ':name-demo_data-:sys_id.json'
 *      contentField: demo_data
 *
 * getFileNameFields('sp_widget');
 * // => ['name', 'client_script', 'css', 'demo_data']
 * @returns {string[]} An array with field names used for the given table’s records’ filenames
 */
function getFileNameFields(table) {
  const config = parseConfigFile();
  const tableConfig = config.config[table];
  const nameFields = tableConfig.nameField;

  const formattedNameFields = (typeof nameFields === 'string') ? [nameFields] : [...nameFields];
  const tableFileKeyObjs = _.flatten(_.map(tableConfig.formats, format =>
    pathToRegexp(format.fileName, [], { delimiter: '-' }).keys
  ));
  const tableFileFields = _.map(tableFileKeyObjs, keyObj => keyObj.name);

  return _.uniq( formattedNameFields.concat(tableFileFields) );
}
exports.getFileNameFields = getFileNameFields;

/**
 * Retrieves the ServiceNow field values used in a given filename.
 *
 * @param {string} fileName The file name
 * @param {string} fileTemplate The pathToRegexp string template for fileName
 * @example
 * getFieldValuesFromFileName(
 *   'an_example_ui_page-html-18dabf691322fa00ca1e70a76144b0a2.html',
 *   ':name-html-:sys_id.html'
 * )
 * // => { name: 'an_example_ui_page', sys_id: '18dabf691322fa00ca1e70a76144b0a2' }
 * @returns {object} The ServiceNow record’s field:value hash extracted from the file
 */
function getFieldValuesFromFileName(fileName, fileTemplate) {
  const templateKeys = [];
  const templateTokens = pathToRegexp(fileTemplate, templateKeys, { delimiter: '-' });
  const fieldValues = templateTokens.exec(fileName);

  fieldValues.shift(); // first element is just the file name

  const matches = {};
  _.forEach(fieldValues, (value, i) => {
    matches[templateKeys[i].name] = value;
  });
  return matches;
}
exports.getFieldValuesFromFileName = getFieldValuesFromFileName;

/**
 * Returns a given path string without the current working directory.
 *
 * @param {string} filePath a file path
 * @example
 * // Given current working directory is '/an/example/working/directory'
 * trimCwd('/an/example/working/directory/without/the/working/directory');
 * // => '/without/the/working/directory'
 * @returns {string}
 */
function trimCwd(filePath) {
  const cwd = process.cwd();

  if (filePath.indexOf(cwd) !== 0) {
    throw new Error(`Incorrect usage of trimCwd; cwd "${cwd}" not found in filePath "${filePath}"`);
  }

  return filePath.substr(cwd.length);
}
exports.trimCwd = trimCwd;
