const config = require('./config');
const create = require('./create');
const del = require('./delete');
const info = require('./info');
const list = require('./list');
const pull = require('./pull');
const push = require('./push');
const sync = require('./sync');
const watch = require('./watch');

module.exports = {
	config: {
		description: 'Initiates config for current folder (instance url, auth type, etc.)',
		command: config
	},
	create: {
		description: 'Create a record on ServiceNow and sync it with its local file in project folder.',
		command: create
	},
	delete: {
		description: 'Removes file from ServiceNow and project folder',
		command: del
	},
	info: {
		description: 'Lists information about ServiceNow instance (url, version, etc.)',
		command: info
	},
	list: {
		description: 'Lists all records of a record type sync’d in project folder with ServiceNow',
		command: list
	},
	pull: {
		description: 'Pull all sync’d files to project folder from ServiceNow',
		command: pull
	},
	push: {
		description: 'Push files in project folder to ServiceNow',
		command: push
	},
	sync: {
		description: 'Select which records of a record type to sync with ServiceNow',
		command: sync
	},
	watch: {
		description: 'Watches project folder files for changes and pushes changes to ServiceNow',
		command: watch
	}
};
