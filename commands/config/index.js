const path = require('path');
const yeoman = require('yeoman-environment');
const CommandParser = require('../command-parser');

module.exports = class Config extends CommandParser {
  action() {
    const yeomanEnv = yeoman.createEnv();
    const gen = yeomanEnv.getByPath(
      path.resolve(__dirname, 'config-generator.js')
    );

    yeomanEnv.run([gen.namespace], {}, () => {});
  }
};
