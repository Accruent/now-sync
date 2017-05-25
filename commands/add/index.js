const path = require('path');
const yeoman = require('yeoman-environment');

const CommandParser = require('../command-parser');

module.exports =
class Create extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  action() {
    const yeomanEnv = yeoman.createEnv();
    const gen = yeomanEnv.getByPath( path.resolve(__dirname, 'add-generator.js') );

    yeomanEnv.run([gen.namespace], {}, () => {});
  }
};
