#!/usr/bin/env node

import { parseArgs } from 'util';

const { positionals: args } = parseArgs({
	__proto__: null,
	allowPositionals: true,
});

if (args.length !== 1) {
	console.error('Usage: add-fixture <fixture-name[@version]>');
	process.exit(1);
}

const [spec] = args;

import pacote from 'pacote';
import path from 'path';
import npa from 'npm-package-arg';

const name = /** @type {string} */ (npa(spec).name).replace('/', '~');

const fixtureDir = path.join(import.meta.dirname, 'fixtures', name);

const projectDir = path.join(fixtureDir, 'project');

await pacote.extract(spec, projectDir);

import glob from 'glob-gitignore';

const filesToTruncate = glob.sync('**/*', {
	__proto__: null,
	cwd: projectDir,
	dot: true,
	dotRelative: true,
	nodir: true,
	ignore: ['**/*.json'],
});

import { truncate, rm, mkdir } from 'fs/promises';
await Promise.all(filesToTruncate.map((file) => {
	if ((/\.(?:md|txt)$/).test(file)) {
		return rm(path.join(projectDir, file));
	}
	return truncate(path.join(projectDir, file));
}));

import { execSync } from 'child_process';
execSync(
	'npm pkg delete dependencies devDependencies peerDependencies optionalDependencies bundleDependencies bundledDependencies publishConfig scripts',
	/** @type {import('child_process').ExecSyncOptions} */ ({
		__proto__: null,
		cwd: projectDir,
		stdio: 'inherit',
	}),
);

console.log(`Added fixture: ${name}`);

console.log('writing initial test results - YOU MUST REVIEW');

await mkdir(path.join(fixtureDir, 'expected'), /** @type {import('fs').MakeDirectoryOptions} */ ({ __proto__: null, recursive: true })).catch();

try {
	execSync('npm run tests-only', /** @type {import('child_process').ExecSyncOptions} */ (/** @type {unknown} */ ({
		__proto__: null,
		cwd: import.meta.dirname,
		stdio: 'inherit',
		env: {
			__proto__: null,
			...process.env,
			WRITE: 1,
			GREP: name.replace('~', '/'),
		},
	})));
} catch {
	// the WRITE run is expected to exit non-zero: it compares against the not-yet-written expectations before writing them
}

console.log(`\nWrote initial expectations for ${name} - YOU MUST REVIEW them, then re-run the tests to confirm they pass.`);
