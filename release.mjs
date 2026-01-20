import { execSync } from 'child_process';
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

	const messageTemplate = execSync(
		'npm --no-workspaces config get message',
		{ cwd, encoding: 'utf-8' },
	).trim().replaceAll('%s', version);

	execSync(`git commit -m "${messageTemplate}"`, { stdio: 'inherit' });

	const rawTagPrefix = JSON.parse(execSync(
		'npm --no-workspaces pkg get auto-changelog.tagPrefix',
		{ cwd, encoding: 'utf-8' },
	).trim());
	const tagPrefix = typeof rawTagPrefix === 'string' ? rawTagPrefix : 'v';

	execSync(`git tag -a "${tagPrefix}${version}" -m "${messageTemplate}"`, { stdio: 'inherit' });
} else {
	console.error('rerun with --no-workspaces to avoid workspace side effects');
	execSync('git checkout -- package.json');

	process.exitCode = 1;
}
