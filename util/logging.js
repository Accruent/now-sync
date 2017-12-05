/* eslint-disable no-console */

const chalk = require('chalk');
const map = require('lodash/map');
const moment = require('moment');

exports.logInfo = function logInfo(...messages) {
  const formattedMessages = map(messages, msg => generateLogStr(msg));
  console.log.apply(this, formattedMessages);
};

exports.logWarn = function logWarn(...messages) {
  const formattedMessages = map(messages, msg =>
    chalk.yellow(generateLogStr(msg))
  );
  console.warn.apply(this, formattedMessages);
};

exports.logError = function logError(...messages) {
  const formattedMessages = map(messages, msg =>
    chalk.bold.red(generateLogStr(msg))
  );
  console.error.apply(this, formattedMessages);
};

function generateLogStr(msg) {
  return `${generateTimestampStr()}: ${msg}`;
}

function generateTimestampStr() {
  return `[${moment().format('YYYY-MM-DD HH:mm:ss')}]`;
}
