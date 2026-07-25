'use strict';

const fs = require('fs');
const path = require('path');

// required by `../index.js` so `npm run tests-only` runs the ls-exports unit tests too
fs.readdirSync(__dirname).forEach((file) => {
	if (file !== 'index.js' && file.endsWith('.js')) {
		require(path.join(__dirname, file)); // eslint-disable-line global-require
	}
});
