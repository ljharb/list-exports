'use strict';

const chalk = require('chalk');
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
		log(`${chalk.blue(x.name)} @ ${x.version}`);
		log(chalk.bold.red('package is private'));
		return;
	}

	const summaryRows = [
		[
			`${chalk.blue(x.name)} @ ${x.version}`,
			chalk.green('node with ESM (>= 13.1)'),
			chalk.green('node pre-ESM (> 13.1)'),
		].map((r) => chalk.bold(r)),
		[
			chalk.red('Binaries'),
			x.binaries.length || '',
			x.binaries.length || '',
		],
		[
			chalk.red('CJS + ESM Export Specifiers'),
			x.require.length,
			x['require (pre-exports)'].length,
		],
		[
			chalk.red('ESM-only Export Specifiers'),
			x.import.length,
			'',
		],
		[
			chalk.red('Exposed Files'),
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
	log(chalk.bold(`Top-level ${chalk.reset.magenta('files')}/${chalk.bold.cyan('directories')} that contribute specifiers:`));
	const treeRows = Object.keys({ ...x.tree[x.name], ...x['tree (pre-exports)'][x.name] })
		.sort((a, b) => (a.endsWith('/') ? b.endsWith('/') ? a.localeCompare(b) : -1 : 1))
		.map((file) => [
			file.endsWith('/') ? chalk.bold.cyan(file) : chalk.magenta(file),
			x.tree[x.name][file],
			x['tree (pre-exports)'][x.name][file],
		]);
	log(table(treeRows, tableOptions));

	log(chalk.dim('run the same command with `--json` for full details'));
};
