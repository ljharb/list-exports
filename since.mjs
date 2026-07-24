import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import glob from 'glob-gitignore';

const packagesDir = path.join(import.meta.dirname, 'packages');
const docsDir = path.join(import.meta.dirname, 'docs');

/** @typedef {{ private?: boolean, name: string, version: string }} PackageJSON */

const packages = (process.argv.length > 2 ? [process.argv[2]] : glob.sync('*', { cwd: packagesDir }))
	.map((name) => path.join(packagesDir, name, 'package.json'))
	.filter((packagePath) => fs.existsSync(packagePath))
	.map((packagePath) => /** @type {PackageJSON} */ (JSON.parse(`${fs.readFileSync(packagePath)}`)))
	.filter((x) => !x.private && x.name !== 'enzyme-example-mocha');

packages.forEach((pkg) => {
	const tag = `${pkg.name === 'docs' ? 'enzyme' : pkg.name}@${pkg.version}`;
	const dir = path.join(packagesDir, pkg.name);
	const logArgs = [
		'--no-pager',
		'log',
		'--oneline',
		`${tag}..HEAD`,
		dir,
		':!**/.eslintrc',
	].concat(pkg.name === 'enzyme' ? docsDir : []);
	const log = spawnSync('git', logArgs, { stdio: 'pipe' });
	if (log.stdout.length > 0 || log.stderr.length > 0) {
		console.log(tag);
		spawnSync('git', logArgs, { stdio: 'inherit' });
		console.log('\n');
	}
});
