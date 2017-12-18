const fetch = require('node-fetch');
const merge = require('lodash/merge');
const { parseConfigFile } = require('./config');

function generateBaseOptions() {
  const auth = parseConfigFile(true);
  const baseOptions = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };
  if (auth) {
    baseOptions.headers.Authorization = `Basic ${auth.key}`;
  }

  return baseOptions;
}

function get(url, opts) {
  const options = merge({}, generateBaseOptions(), opts);
  options.method = 'GET';

  return fetchJson(url, options);
}
exports.get = get;

function post(url, opts) {
  const options = merge({}, generateBaseOptions(), opts);
  options.method = 'POST';

  return fetchJson(url, options);
}
exports.post = post;

function put(url, opts) {
  const options = merge({}, generateBaseOptions(), opts);
  options.method = 'PUT';

  return fetchJson(url, options);
}
exports.put = put;

async function fetchJson(url, options) {
  if (typeof fetch === 'function') {
    const stream = await fetch(url, options);
    try {
      const json = await stream.json();
      return json;
    } catch (e) {
      if (stream.status !== 200) {
        throw new Error(stream.statusText);
      }

      throw e;
    }
  }

  throw new Error('fetch isn’t a function?!');
}
