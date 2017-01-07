const fs = require('fs');
const yaml = require('js-yaml');
const isUndefined = require('lodash/isUndefined');
const { configFilePath } = require('../constants');

module.exports = parseConfigFile;

let configFileContents;
function parseConfigFile() {
	if ( !isUndefined(configFileContents) ) {
		return configFileContents;
	}

	try {
		configFileContents = yaml.safeLoad(
			fs.readFileSync(configFilePath, { encoding: 'utf8' })
		);
	} catch (err) {
		configFileContents = false;
	}

	return configFileContents;
}
