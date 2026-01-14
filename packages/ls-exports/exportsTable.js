'use strict';

const { styleText } = require('util');
const fromEntries = require('object.fromentries');
const values = require('object.values');
const stripANSI = require('strip-ansi');
const walk = require('tree-walk');

const listExports = require('list-exports');
const table = require('./table');

function sumTreeLeaves(root) {
	walk.postorder(root, (value, key, parent) => {
		/* eslint no-param-reassign: 1 */
		if (Array.isArray(parent) || parent === root) {
			return;
		}
		if (Array.isArray(value)) {
			parent[key] = value.length;
		} else if (parent) {
			if (typeof value !== 'number') { // TODO: remove this, once this function no longer mutates
				const sum = values(value).reduce((a, b) => a + b, 0);
				if (typeof sum === 'number') {
					delete parent[key];
					parent[`${key}/`] = sum;
				}
			}
		}
	});
}

module.exports = async function exportsTable(packageDir, log) {
	const x = await listExports(packageDir);

	if (x.private) {
		log(`${styleText('blue', x.name)} @ ${x.version}`);
		log(styleText(['bold', 'red'], 'package is private'));
		return;
	}

	const summaryRows = [
		[
			`${styleText('blue', x.name)} @ ${x.version}`,
			styleText('green', 'node with ESM (>= 13.1)'),
			styleText('green', 'node pre-ESM (> 13.1)'),
		].map((r) => styleText('bold', r)),
		[
			styleText('red', 'Binaries'),
			x.binaries.length || '',
			x.binaries.length || '',
		],
		[
			styleText('red', 'CJS + ESM Export Specifiers'),
			x.require.length,
			x['require (pre-exports)'].length,
		],
		[
			styleText('red', 'ESM-only Export Specifiers'),
			x.import.length,
			'',
		],
		[
			styleText('red', 'Exposed Files'),
			x.files.length,
			x['files (pre-exports)'].length,
		],
	];
	const widths = summaryRows.reduce(
		(maxes, cols) => cols
			.map((col) => stripANSI(String(col)).length)
			.map((len, i) => Math.max(maxes[i] || 0, len)),
		[],
	);
	const columns = fromEntries(widths.map((width, i) => [
		i,
		{ width, alignment: i === 0 ? 'left' : 'right' },
	]));
	const tableOptions = { columns };
	log(table(summaryRows, tableOptions));

	sumTreeLeaves(x.tree);
	sumTreeLeaves(x['tree (pre-exports)']);
	log(styleText('bold', 'Top-level ') + styleText('magenta', 'files') + styleText('bold', '/') + styleText(['bold', 'cyan'], 'directories') + styleText('bold', ' that contribute specifiers:'));
	const treeRows = Object.keys({ ...x.tree[x.name], ...x['tree (pre-exports)'][x.name] })
		.sort((a, b) => (a.endsWith('/') ? b.endsWith('/') ? a.localeCompare(b) : -1 : 1))
		.map((file) => [
			file.endsWith('/') ? styleText(['bold', 'cyan'], file) : styleText('magenta', file),
			x.tree[x.name][file],
			x['tree (pre-exports)'][x.name][file],
		]);
	log(table(treeRows, tableOptions));

	if (x.errors.length > 0) {
		log(styleText(['bold', 'red'], '!! Errors:'));
		log(table([x.errors.map((e) => e.replace(process.cwd(), '$PWD'))]));
	}

	log(styleText('dim', 'run the same command with `--json` for full details'));
};
