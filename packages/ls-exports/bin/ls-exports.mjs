#!/usr/bin/env node

import path from 'path';
import npa from 'npm-package-arg';
import { colorize } from 'json-colorizer';
import pargs from 'pargs';
import fromEntries from 'object.fromentries';
import arrayFrom from 'array.from';

import listExports from 'list-exports';
import exportsTable from '../exportsTable.js';
import getPackageJSONPath from '../getPackageJSONPath.js';

const subcommandConfig = {
	options: {
		json: {
			type: 'boolean',
			default: false,
		},
	},
	allowPositionals: 1,
	minPositionals: 1,
};

const {
	help,
	command,
} = await pargs(import.meta.filename, {
	subcommands: {
		package: subcommandConfig,
		path: subcommandConfig,
	},
});

await help();

function serializer(key, value) {
	if (value instanceof Set) {
		return arrayFrom(value);
	}
	if (value instanceof Map) {
		return fromEntries(arrayFrom(value));
	}
	return value;
}

let packageDirP;

if (command.name === 'path') {
	const [pathArg] = command.positionals;
	packageDirP = Promise.resolve(path.join(path.resolve(pathArg), 'package.json'));
} else if (command.name === 'package') {
	const [specifier] = command.positionals;
	try {
		npa(specifier);
	} catch {
		console.error(`Invalid package specifier: ${specifier}`);
		process.exitCode = 1;
		process.exit();
	}
	packageDirP = getPackageJSONPath(specifier);
}

const promise = packageDirP.then((packageDir) => (command.values.json
	? listExports(packageDir).then((x) => console.log(colorize(JSON.stringify(x, serializer))))
	: exportsTable(packageDir, (x) => console.log(x))));

promise.catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
