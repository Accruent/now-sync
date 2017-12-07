const _ = require('lodash');
const pathToRegexp = require('path-to-regexp');
const { parseConfigFile } = require('./config');

// characters found in the record name that will be replaced
const replaceFileNameRe = [
  { toReplace: new RegExp('-', 'g'), replaceWith: '^' }
  // { toReplace: new RegExp('/', 'g'), replaceWith: '%' } // throwing an error instead
];

// characters found in the record name that will throw an error
const errorFileNameRe = [/\//g];

// replaces periods with this string when parsing information from file templates so that reference field values can be properly interpreted.
const FAULTY_PATHTOREGEXP_DELIMITER_STR = ['XYZ', /XYZ/g];

/**
 * Replaces a file template’s periods (except the last one, which is used for file extension separation) with a string, so that pathToRegExp doesn’t misinterpret a reference field with a separate field.
 *
 * @param {string} fileTemplate The file template string
 * @returns {string} The updated file template string with periods replaced with FAULTY_PATHTOREGEXP_DELIMITER_STR
 */
function getSafeFileTemplate(fileTemplate) {
  const templateLastPeriodIndex = fileTemplate.lastIndexOf('.');

  return fileTemplate.replace(
    /\./g,
    (char, index) =>
      // replace . with FAULTY_PATHTOREGEXP_DELIMITER_STR (if it's not the last period separating the file extension)
      index === templateLastPeriodIndex
        ? char
        : FAULTY_PATHTOREGEXP_DELIMITER_STR[0]
  );
}

/**
 * Compiles a now-sync file name using a given file template and record data.
 *
 * @param {string} fileTemplate A pathToRegexp string
 * @param {object} data A field:value hash representing record data
 * @returns {string} The compiled file name.
 */
function compileFileName(fileTemplate, data) {
  // we need to replace non-filename-extension period characters with a temporary string for the time being that won’t be detected as a delimiter in pathToRegexp (so that field values of reference fields can be used for file naming)
  const safeFileTemplate = getSafeFileTemplate(fileTemplate);

  const tokens = pathToRegexp.parse(safeFileTemplate, { delimiter: '-' });
  const fileNameFragments = _.map(tokens, token => {
    if (typeof token === 'string') {
      return token;
    }

    // switch back to . instead of FAULTY_PATHTOREGEXP_DELIMITER_STR
    let tokenFromData =
      data[token.name.replace(FAULTY_PATHTOREGEXP_DELIMITER_STR[1], '.')];
    let i;
    for (i = 0; i < errorFileNameRe.length; i++) {
      const errorFileNameReExec = errorFileNameRe[i].exec(tokenFromData);
      if (errorFileNameReExec) {
        throw new Error(
          `Invalid character "${
            errorFileNameReExec[0]
          }" found in the record’s \`${
            token.name
          }\` field. Change your record’s \`${
            token.name
          }\` field value and try again.`
        );
      }
    }

    for (i = 0; i < replaceFileNameRe.length; i++) {
      const replaceChar = replaceFileNameRe[i];

      if (replaceChar.toReplace.test(tokenFromData)) {
        tokenFromData = tokenFromData.replace(
          replaceChar.toReplace,
          replaceChar.replaceWith
        );
      }
    }
    return tokenFromData;
  });

  return fileNameFragments.join('');
}
exports.compileFileName = compileFileName;

/**
 * Creates the file template string used for file naming given an array of record field names used for file naming, the actual field name represented by the file content, and the file extension
 *
 * @param {string[]} nameFields field names used for naming the file
 * @param {string} fieldName the actual field name of the record whose value contains the file content
 * @param {string} extension file extension (example: 'js')
 * @returns {string} compiled file template
 */
function compileFileTemplate(nameFields, fieldName, extension) {
  const filenamePrefix = _.map(nameFields, name => `:${name}`).join('-');
  return `${filenamePrefix}-${fieldName}-:sys_id.${extension}`;
}
exports.compileFileTemplate = compileFileTemplate;

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

  const formattedNameFields =
    typeof nameFields === 'string' ? [nameFields] : [...nameFields];
  const tableFileKeyObjs = _.flatten(
    _.map(tableConfig.formats, format => {
      const keys = [];
      pathToRegexp(format.fileName, keys, { delimiter: '-' });
      return keys;
    })
  );
  const tableFileFields = _.map(tableFileKeyObjs, keyObj => keyObj.name);

  return _.uniq(formattedNameFields.concat(tableFileFields));
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
  // we need to replace non-filename-extension period characters with a temporary string for the time being that won’t be detected as a delimiter in pathToRegexp (so that field values of reference fields can be used for file naming)
  const safeFileTemplate = getSafeFileTemplate(fileTemplate);
  const templateTokens = pathToRegexp(safeFileTemplate, templateKeys, {
    delimiter: '-'
  });
  const fieldValues = templateTokens.exec(fileName);

  fieldValues.shift(); // first element is just the file name

  const matches = {};

  // replacing the temporary string with .
  _.forEach(templateKeys, token => {
    token.name = token.name.replace(FAULTY_PATHTOREGEXP_DELIMITER_STR[1], '.');
  });

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
    throw new Error(
      `Incorrect usage of trimCwd; cwd "${cwd}" not found in filePath "${
        filePath
      }"`
    );
  }

  return filePath.substr(cwd.length);
}
exports.trimCwd = trimCwd;
