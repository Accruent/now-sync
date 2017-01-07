const fs = require('fs');
const isUndefined = require('lodash/isUndefined');
const { configFilePath } = require('../constants');

module.exports = parseConfigFile;

let configFileContents;
function parseConfigFile() {
	if ( isUndefined(configFileContents) ) {
		try {
			configFileContents = fs.readFileSync(configFilePath, { encoding: 'utf8' });
		} catch (err) {
			configFileContents = false;
		}
	}

	return configFileContents;
}
