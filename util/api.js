const fetch = require('node-fetch');
const cloneDeep = require('lodash/cloneDeep');
const parseConfigFile = require('./parse-config-file');

const { url, auth } = parseConfigFile();
const baseOptions = {
	headers: {
		'Content-Type': 'application/json',
		Authorization: `Basic ${auth.key}`
	}
};

function get(endpoint) {
	const formattedEndpoint = formatEndpoint(endpoint);

	const options = cloneDeep(baseOptions);
	options.method = 'GET';

	return fetch(`${url}/api/now/v1/${formattedEndpoint}`, options)
		.then( stream => stream.json() );
}
exports.get = get;

//////

function formatEndpoint(rawEndpoint) {
	if (rawEndpoint.indexOf('/') === 0) {
		return rawEndpoint.substr(1);
	}
	return rawEndpoint;
}
