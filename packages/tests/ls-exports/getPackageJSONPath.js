'use strict';

const test = require('tape');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { SKIP_CLI } = process.env;

const repoRoot = path.join(__dirname, '..', '..', '..');
const getPackageJSONPath = path.join(repoRoot, 'packages', 'ls-exports', 'getPackageJSONPath.mjs');
const fixtureProject = path.join(__dirname, '..', 'fixtures', 'ex-null-exports', 'project');

// `ls-exports` requires node 22+; the node-18 test matrix sets SKIP_CLI
test('getPackageJSONPath removes its extracted temp directory on process exit', { skip: !!SKIP_CLI }, (t) => {
	const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lx-pack-'));
	t.teardown(() => {
		fs.rmSync(packDir, { recursive: true, force: true });
	});

	// pack the fixture to a tarball so `pacote.extract` runs fully offline (a `file:` dir spec would need an Arborist tree)
	const packOutput = execFileSync(
		'npm',
		['pack', fixtureProject, '--pack-destination', packDir, '--silent'],
		{ encoding: 'utf8' },
	);
	const tarball = path.join(packDir, `${packOutput.trim().split('\n').pop()}`);

	// a child process extracts the tarball via getPackageJSONPath and prints the temp dir it created, then exits
	const child = `
		import getPackageJSONPath from ${JSON.stringify(getPackageJSONPath)};
		const p = await getPackageJSONPath('ex-null-exports@file:' + ${JSON.stringify(tarball)});
		process.stdout.write(p.slice(0, p.indexOf(${JSON.stringify(`${path.sep}node_modules${path.sep}`)})));
	`;
	const tempDir = execFileSync(process.execPath, ['--input-type=module', '-e', child], { encoding: 'utf8' }).trim();

	t.ok(tempDir, 'the child reported the temp directory it extracted into');
	t.notOk(fs.existsSync(tempDir), 'the extracted temp directory is gone once the child has exited');

	t.end();
});
