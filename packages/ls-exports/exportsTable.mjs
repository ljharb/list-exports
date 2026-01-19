import { styleText, stripVTControlCharacters } from 'util';
import fromEntries from 'object.fromentries';
import values from 'object.values';

import listExports from 'list-exports';
import table from './table.mjs';

const { keys } = Object;

function sumTreeLeaves(treeMap) {
	const result = {};
	treeMap.forEach((value, key) => {
		if (value instanceof Set) {
			result[key] = value.size;
		} else if (value instanceof Map) {
			const subResult = sumTreeLeaves(value);
			const sum = values(subResult).reduce((a, b) => a + b, 0);
			result[`${key}/`] = sum;
		}
	});
	return result;
}

export default async function exportsTable(packageDir, log) {
	const x = await listExports(packageDir);

	if (x.private) {
		log(`${styleText('blue', x.name)} @ ${x.version}`);
		log(styleText(['bold', 'red'], 'package is private'));
		return;
	}

	const { exports: exp } = x;
	const latest = exp[exp.latest];
	const preExports = exp['pre-exports'];

	const binariesCount = keys(exp.binaries).length;

	const summaryRows = [
		[
			`${styleText('blue', x.name)} @ ${x.version}`,
			styleText('green', 'node with ESM (>= 13.1)'),
			styleText('green', 'node pre-ESM (> 13.1)'),
		].map((r) => styleText('bold', r)),
		[
			styleText('red', 'Binaries'),
			binariesCount || '',
			binariesCount || '',
		],
		[
			styleText('red', 'CJS + ESM Export Specifiers'),
			latest.require.size,
			preExports.require.size,
		],
		[
			styleText('red', 'ESM-only Export Specifiers'),
			latest.import.size,
			'',
		],
		[
			styleText('red', 'Exposed Files'),
			latest.files.size,
			preExports.files.size,
		],
	];
	const widths = summaryRows.reduce(
		(maxes, cols) => cols
			.map((col) => stripVTControlCharacters(String(col)).length)
			.map((len, i) => Math.max(maxes[i] || 0, len)),
		[],
	);
	const columns = fromEntries(widths.map((width, i) => [
		i,
		{ width, alignment: i === 0 ? 'left' : 'right' },
	]));
	const tableOptions = { columns };
	log(table(summaryRows, tableOptions));

	const latestTreeSums = sumTreeLeaves(latest.tree);
	const preExportsTreeSums = sumTreeLeaves(preExports.tree);
	log(styleText('bold', 'Top-level ') + styleText('magenta', 'files') + styleText('bold', '/') + styleText(['bold', 'cyan'], 'directories') + styleText('bold', ' that contribute specifiers:'));
	const treeRows = keys({ ...latestTreeSums, ...preExportsTreeSums })
		.sort((a, b) => (a.endsWith('/') ? b.endsWith('/') ? a.localeCompare(b) : -1 : 1))
		.map((file) => [
			file.endsWith('/') ? styleText(['bold', 'cyan'], file) : styleText('magenta', file),
			latestTreeSums[file],
			preExportsTreeSums[file],
		]);
	log(table(treeRows, tableOptions));

	if (x.problems.size > 0) {
		log(styleText(['bold', 'red'], '!! Errors:'));
		log(table([Array.from(x.problems, (e) => e.replace(process.cwd(), '$PWD'))]));
	}

	log(styleText('dim', 'run the same command with `--json` for full details'));
}
