import { execSync, execFileSync } from 'child_process';
import { readFileSync } from 'fs';

const {
	npm_package_version: version,
	npm_lifecycle_event: script,
	npm_config_local_prefix: prefix,
} = process.env;

const cwd = process.cwd();

if (!version || script !== 'version') {
	throw 'this script must run in "version"'; // eslint-disable-line no-throw-literal
}

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
if (pkg.private) {
	throw 'cannot version a private package'; // eslint-disable-line no-throw-literal
}

if (prefix === cwd) {
	execSync('auto-changelog -p');

	execSync('git add package.json CHANGELOG.md', { stdio: 'inherit' });

	const messageTemplate = execFileSync(
		'npm',
		['--no-workspaces', 'config', 'get', 'message'],
		{ cwd, encoding: 'utf-8' },
	).trim().replaceAll('%s', version);

	execFileSync('git', ['commit', '-m', messageTemplate], { stdio: 'inherit' });

	const rawTagPrefix = JSON.parse(execFileSync(
		'npm',
		['--no-workspaces', 'pkg', 'get', 'auto-changelog.tagPrefix'],
		{ cwd, encoding: 'utf-8' },
	).trim());
	const tagPrefix = typeof rawTagPrefix === 'string' ? rawTagPrefix : 'v';

	if (!(/^[A-Za-z0-9._@/-]*$/).test(tagPrefix)) {
		throw new Error(`refusing to release: auto-changelog.tagPrefix contains unsafe characters: ${JSON.stringify(tagPrefix)}`);
	}

	execFileSync('git', ['tag', '-a', `${tagPrefix}${version}`, '-m', messageTemplate], { stdio: 'inherit' });
} else {
	console.error('rerun with --no-workspaces to avoid workspace side effects');
	execSync('git checkout -- package.json');

	process.exitCode = 1;
}
