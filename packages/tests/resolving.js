'use strict';

const test = require('tape');
const path = require('path');
const fs = require('fs');
const entries = require('object.entries');
const getCategoriesForRange = require('node-exports-info/getCategoriesForRange');
const getPackageType = require('get-package-type');
const getRangePairs = require('node-exports-info/getRangePairs');
const hasDynamicImport = require('has-dynamic-import');
const resolve = require('resolve/sync');
const { satisfies } = require('semver');

const { GREP } = process.env;

const fixturesDir = path.join(__dirname, 'fixtures');
const fixtures = fs.readdirSync(fixturesDir).filter((x) => !x.startsWith('.')).map((x) => x.replace('~', '/'));

const re = GREP && new RegExp(GREP);

const supportsImportAssert = satisfies(process.version, '^16.14 || >= 17.1'); // TODO: make an entry point on hasDynamicImport
const supportsImportWith = satisfies(process.version, '> 21'); // TODO: make an entry point on hasDynamicImport when node supports this

function isInternalPackage(name) {
	return name === 'ls-exports' || name === 'list-exports';
}

function readExpectedJson(expectedPath, packageData) {
	try {
		const expected = JSON.parse(fs.readFileSync(expectedPath));
		if (isInternalPackage(expected.name)) {
			expected.version = packageData.version;
		}
		return expected;
	} catch (e) {
		return {};
	}
}

const currentCategories = getCategoriesForRange(process.version);
const categories = getRangePairs();

test('native node resolution', (t) => {
	t.plan(fixtures.length);

	fixtures.forEach((fixture) => {
		const fixtureDir = path.join(fixturesDir, fixture.replace('/', '~'));
		const projectDir = path.join(fixtureDir, 'project');

		const packageJSON = path.resolve(path.join(projectDir, 'package.json'));
		const packageData = JSON.parse(fs.readFileSync(packageJSON));
		const { name, engines } = packageData;

		if (isInternalPackage(name) && !satisfies(process.version, engines.node)) {
			t.skip(`fixture: internal package ${fixture}: engines.node does not match current node version`);
			return;
		}
		const skip = packageData.private ? ': private: true' : re && !re.test(fixture) ? ': filtered' : false;

		t.test(`fixture: ${fixture}`, { skip }, async (st) => {
			let found = 0;
			categories.forEach((entry) => {
				const category = entry[1];

				// TODO: when current category doesn't exist, grab "latest"
				const rangeMatchesCurrent = currentCategories.includes(category);
				const expectedPath = path.join(fixtureDir, 'expected', `${category}.json`);
				const exists = fs.existsSync(expectedPath);
				if (exists) {
					found += 1;
				}

				const expected = readExpectedJson(expectedPath, packageData);
				const exportResults = expected.exports[category];

				const skipReason = rangeMatchesCurrent
					? exists
						? exportResults
							? false
							: 'expected JSON lacks `exports` results'
						: 'expected JSON does not exist'
					: 'range does not match current node version';

				st.test(`${fixture} (${category}): native node resolution`, { skip: skipReason }, async (s2t) => {
					entries(exportResults.require).forEach(([specifier, file]) => {
						const fixtureSpec = `@fixtures/${specifier.replace(/^\./, name)}`;

						const fixtureNM = fixtureSpec.split(path.sep).slice(0, 2).join(path.sep);
						const fixtureNMdir = path.dirname(resolve(path.join(fixtureNM, 'package.json'), { preserveSymlinks: true }));
						const fixtureRealDir = path.dirname(resolve(path.join(fixtureNM, 'package.json'), { preserveSymlinks: false }));

						s2t.equal(
							projectDir,
							fixtureRealDir,
							'precondition: `fixtureNMdir`’s real path is `projectDir`',
							{ skip: isInternalPackage(name) },
						);

						try {
							const resolvedPath = require.resolve(fixtureSpec);
							s2t.equal(
								path.relative(
									fixtureNMdir,
									resolvedPath,
								),
								path.relative(
									fixtureNMdir,
									isInternalPackage(name)
										? path.join(__dirname, '..', name, file)
										: path.join(projectDir, file),
								),
								`${fixture} (${category}): ${specifier} resolves natively`,
							);
						} catch (e) {
							if (e.code === 'ERR_INVALID_PACKAGE_TARGET') {
								s2t.comment(`# SKIP (require) ${fixtureSpec} is not a valid package target`);
							} else {
								throw e;
							}
						}
					});

					if (await hasDynamicImport()) {
						await entries(exportResults.import).reduce(async (prev, [specifier, file]) => {
							await prev;

							const fixtureSpec = `@fixtures/${specifier.replace(/^\./, name)}`;
							const fullFilename = fs.realpathSync(path.join(__dirname, `../../node_modules/@fixtures/${file.replace(/^\./, name)}`));
							const ext = path.extname(fullFilename);
							const isESM = ext === '.mjs' || (ext === '.js' && getPackageType.sync(fullFilename) === 'module');
							delete require.cache[fullFilename];
							try {
								if (ext === '.json') {
									if (supportsImportAssert) {
									// eslint-disable-next-line no-new-func
										await Function('fixtureSpec', 'return import(fixtureSpec, { assert: { type: "json" } })')(fixtureSpec);
									} else if (supportsImportWith) {
										// eslint-disable-next-line no-new-func
										await Function('fixtureSpec', 'return import(fixtureSpec, { with: { type: "json" } })')(fixtureSpec);
									}
								} else {
									// eslint-disable-next-line no-new-func
									await Function('fixtureSpec', 'return import(fixtureSpec)')(fixtureSpec);
								}
							} catch (e) {
								if (e.code === 'ERR_INVALID_PACKAGE_TARGET') {
									s2t.comment(`# SKIP (import) ${fixtureSpec} is not a valid package target`);
								} else {
									throw e;
								}
							}
							const mod = require.cache[fullFilename];
							s2t.equal(
								mod && mod.filename,
								fullFilename,
								`${fixture} (${category}): ${specifier} dynamic imports successfully`,
								{
									todo: !mod || mod.filename !== fullFilename,
									skip: isESM
										? 'ESM imports do not populate the CJS module cache'
										: specifier === '.'
											? 'import() fails to populate the require cache when importing CJS as a `main`'
											: path.basename(fullFilename) === 'index.js'
												? 'import() fails to populate the require cache when importing an `index.js` CJS'
												: false,
								},
							);
						}, Promise.resolve());
					}

					s2t.end();
				});
			});

			st.ok(found > 0, `${fixture}: at least one category is found`);

			st.equal(found, categories.length, `${fixture}: all categories have a fixture`);
		});
	});

	t.end();
});
