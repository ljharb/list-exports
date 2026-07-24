import {
	table as makeTable,
	getBorderCharacters,
} from 'table';

/**
 * @param {readonly (readonly unknown[])[]} data
 * @param {Parameters<typeof makeTable>[1]} [options]
 */
export default function table(data, options = {}) {
	return makeTable(data, {
		border: getBorderCharacters('norc'),
		...options,
	});
}
