const path = require('path');

const configFileName = '.now-sync.yml';
const configFilePath = path.resolve(process.cwd(), configFileName);

module.exports = {
	configFileName,
	configFilePath
};
