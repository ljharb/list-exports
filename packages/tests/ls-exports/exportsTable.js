'use strict';

const test = require('tape');
const path = require('path');

const { SKIP_CLI } = process.env;

// `ex-exports-string` exposes files in only one of the two trees (e.g. `index.mjs` is
// import-only), so its rows exercise the one-sided-cell path.
const oneSidedFixture = path.join(__dirname, '..', 'fixtures', 'ex-exports-string', 'project', 'package.json');

// `ls-exports` requires node 22+ (`util.styleText`); the node-18 test matrix sets SKIP_CLI
test('exportsTable: one-sided tree rows render an empty cell, not `undefined`', { skip: !!SKIP_CLI }, async (t) => {
	const exportsTable = (await import('../../ls-exports/exportsTable.mjs')).default;

	let output = '';
	await exportsTable(oneSidedFixture, (line) => {
		output += `${line}\n`;
	});

	const withoutColor = output.replace(/\[[0-9;]*m/g, ''); // eslint-disable-line no-control-regex
	t.notOk(withoutColor.includes('undefined'), 'no literal "undefined" appears in the rendered table');

	t.end();
});
