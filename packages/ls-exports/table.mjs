import {
	table as makeTable,
	getBorderCharacters,
} from 'table';

export default function table(data, options = {}) {
	return makeTable(data, {
		border: getBorderCharacters('norc'),
		...options,
	});
}
