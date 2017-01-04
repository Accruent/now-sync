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
	config,
	create,
	delete: del,
	info,
	list,
	pull,
	push,
	sync,
	watch
};
