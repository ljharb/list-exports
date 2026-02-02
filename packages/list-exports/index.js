'use strict';

/* eslint no-negated-condition: 1 */

const {
	lstatSync,
	existsSync,
	realpathSync,
} = require('fs');
const {
	basename,
	dirname,
	extname,
	join: pathJoin,
	normalize: pathNormalize,
	relative: pathRelative,
	sep: pathSep,
} = require('path');

const readPackageJSON = require('read-package-json');
const entries = require('object.entries');
const fromEntries = require('object.fromentries');
const flatMap = require('array.prototype.flatmap');
const flat = require('array.prototype.flat');
const filter = require('array.prototype.filter');
const some = require('array.prototype.some');
const resolve = require('resolve');
const packlist = require('npm-packlist');
const getPackageType = require('get-package-type').sync;
const inspect = require('object-inspect');
const Arborist = require('@npmcli/arborist');
const forEach = require('for-each');
const {
	validRange,
	intersects,
	subset,
} = require('semver');
const includes = require('array-includes');
const map = require('array.prototype.map');
const reduce = require('array.prototype.reduce');
const startsWith = require('string.prototype.startswith');
const endsWith = require('string.prototype.endswith');
const GetIntrinsic = require('get-intrinsic');
const callBind = require('call-bind');
const callBound = require('call-bound');
const keys = require('object-keys');
const sortPaths = require('sort-paths');
const arrayFrom = require('array.from');
const hasOwn = require('hasown');
const validateExportsObject = require('validate-exports-object');

const getCategoriesForRange = require('node-exports-info/getCategoriesForRange');
const getConditionsForCategory = require('node-exports-info/getConditionsForCategory');

const $concat = require('safe-array-concat');
const $sort = callBound('Array.prototype.sort');
const $localeCompare = callBound('String.prototype.localeCompare');
const $replace = callBound('String.prototype.replace');
const $split = callBound('String.prototype.split');
const $all = callBind(GetIntrinsic('%Promise.all%'), Promise);

function isDirectory(file) {
	try {
		return lstatSync(file).isDirectory();
	} catch {
		return false;
	}
}

function resolveFrom(file, basedir, extensions) {
	try {
		return resolve.sync(file, { basedir, extensions });
	} catch {
		return null;
	}
}

function stringSort(a, b) {
	return $localeCompare(a, b);
}

function sortTree(treeMap) {
	return new Map(sortPaths(
		arrayFrom(treeMap, ([k, v]) => [k, v instanceof Map ? sortTree(v) : v]),
		([a]) => a,
		'/',
	));
}

function sortFiles(tree) {
	return fromEntries(flatMap(entries(tree), ([k, v]) => {
		if (k === 'hasDirSlash') {
			return [];
		}
		if (k === 'files') {
			return [[k, new Set(sortPaths(filter(arrayFrom(v), Boolean), '/'))]];
		}
		if (k === 'require' || k === 'import') {
			return [[k, new Map(sortPaths(filter(arrayFrom(v), ([, vv]) => vv), ([a]) => a, '/'))]];
		}
		if (k === 'tree') {
			return [[k, sortTree(v)]];
		}
		return [[k, v]];
	}));
}

// Node 22.6.0+ has native TypeScript support (type stripping)
// Use subset to ensure the ENTIRE range supports native TS, not just part of it
function hasNativeTS(nodeRange) {
	return subset(nodeRange, '>=22.6');
}

function getExtensions(packageType = 'commonjs', nodeRange = process.version) {
	if (packageType !== 'commonjs' && packageType !== 'module') {
		throw new TypeError(`unknown package type found: ${inspect(packageType)}`);
	}

	const nativeTS = hasNativeTS(nodeRange);

	let baseExts = filter(
		keys(require.extensions),
		(x) => startsWith(x, '.')
			&& (packageType !== 'module' || x !== '.js')
			&& x !== '.mjs'
			&& x !== '.ts'
			&& x !== '.cts'
			&& x !== '.mts', // always exclude TS from require.extensions; we add them explicitly below when needed
	);
	// when native TS is available, ensure TS extensions are included
	if (nativeTS) {
		baseExts = $concat(baseExts, '.ts', '.cts');
	}
	const base = baseExts;
	const legacy = packageType === 'module' ? $concat(base, '.js') : base;
	let esmExts = $concat(['.mjs'], packageType === 'module' ? '.js' : []);
	if (nativeTS) {
		esmExts = $concat(esmExts, '.mts');
	}
	const esm = esmExts;
	const all = $concat([], esm, '.cjs', base);

	return {
		all,
		base,
		esm,
		legacy,
	};
}

function isCJS(filename, usingExports = false, nodeRange = process.version) {
	const packageType = getPackageType(filename);
	if (packageType !== 'commonjs' && packageType !== 'module') {
		throw new TypeError(`unknown package type found: ${inspect(packageType)}`);
	}
	const { base, legacy } = getExtensions(packageType, nodeRange);
	return includes(usingExports ? base : legacy, extname(filename));
}

function isESM(filename, nodeRange = process.version) {
	const packageType = getPackageType(filename);
	if (packageType !== 'commonjs' && packageType !== 'module') {
		throw new TypeError(`unknown package type found: ${inspect(packageType)}`);
	}
	const { esm } = getExtensions(packageType, nodeRange);
	return includes(esm, extname(filename));
}

async function readPackage(packageJSON) {
	return new Promise((resolveP, rejectP) => {
		readPackageJSON(packageJSON, (err, data) => {
			if (err) {
				rejectP(err);
			} else {
				resolveP(data);
			}
		});
	});
}

async function asyncReduce(items, task, initial = void undefined) {
	return reduce(
		items,
		async (prev, value) => task(await prev, value),
		initial,
	);
}

async function asyncForEach(items, task) {
	return asyncReduce(
		items,
		async (prev, item) => task(item),
	);
}

async function getMain(rootDir, dir, extensions, problems) {
	let hasExplicitMain = false;
	let main;
	const fullDir = pathJoin(rootDir, dir);
	const pkgJSON = pathJoin(fullDir, 'package.json');
	const hasPkgJSON = existsSync(pkgJSON);
	if (hasPkgJSON) {
		try {
			const pkg = await readPackage(pkgJSON);
			hasExplicitMain = 'main' in pkg;
			if (hasExplicitMain) {
				if (typeof pkg.main !== 'string') {
					return null;
				}
				main = $replace(pathNormalize(pkg.main), /^(?:\.\/)?/, './');
			}
		} catch {
			problems.add(`\`${dir}\` has a \`package.json\`, but it is invalid!`);
		}
	}

	if (hasExplicitMain) {
		const fullMain = resolveFrom(main, fullDir, extensions);
		const fullMainExists = existsSync(fullMain);

		if (fullMainExists) {
			return `./${pathRelative(rootDir, fullMain)}`;
		}
	}

	const indexMain = resolveFrom('./index.js', fullDir, extensions);
	if (existsSync(indexMain)) {
		if (hasExplicitMain) {
			problems.add(`\`${dir}\` has a \`package.json\`, but its \`main\` does not exist, although \`index.js\` does.`);
		}
		return `./${pathRelative(rootDir, indexMain)}`;
	} else if (hasExplicitMain) {
		problems.add(`\`${dir}\` has a \`package.json\`, but both its \`main\` and \`index.js\` do not exist!`);
	}

	if (dir === '.') {
		problems.add(`\`${dir}\` has a \`package.json\`, but lacks both a \`main\` and an \`index.js\`!`);
	}
	return null;
}

function safeSet(mapInstance, key, newVal) {
	if (!mapInstance.has(key)) {
		mapInstance.set(key, newVal);
	}
}

async function forEachSubfile(realFile, {
	dir,
	options,
	rootDir,
	mains,
	tree,
	packageExports,
}, fakeFile = realFile) {
	const ext = extname(realFile);
	const extensionless = basename(fakeFile, ext);

	const realFullFile = pathJoin(rootDir, realFile);

	const canRequire = !options.useType || (
		ext !== '.mjs'
		&& (
			getPackageType(realFullFile) !== 'module' // not type module
			|| ext !== '.js' // not .js
		)
	);
	const dirMain = mains && mains.get(dir);

	const hasExports = packageExports && keys(packageExports).length > 0;

	const canImport = options.useType && ext !== '.json';
	if (canImport) {
		// only add "." if there's no exports field, or if exports explicitly includes "."
		if (!options.skipMainDot && mains && mains.get('.') === realFile && !hasExports) {
			safeSet(tree.import, '.', realFile);
		}
		// only add files not in exports when there's no exports field
		if (!hasExports && !hasOwn(packageExports || {}, fakeFile)) {
			safeSet(tree.import, fakeFile, realFile);
		}
	}

	if (canRequire) {
		// only add dir mappings when there's no exports field
		if (!hasExports && dirMain === realFile) {
			safeSet(tree.require, dir, realFile);
			safeSet(tree.require, `${dir}/`, realFile);
		}
		if (mains && mains.get('.') === realFile) {
			// only add "." if there's no exports field, or if exports explicitly includes "."
			if (!options.skipMainDot && !hasExports) {
				safeSet(tree.require, '.', realFile);
			}
			// only add "./" if there's no exports field
			if (!options.skipDirSlash && !hasExports) {
				safeSet(tree.require, './', realFile);
			}
		}
		// only add files not in exports when there's no exports field
		if (!hasExports && !hasOwn(packageExports || {}, fakeFile)) {
			safeSet(tree.require, fakeFile, realFile);
		}
		if (ext !== '.cjs' && ext !== '.mjs') {
			const extlessFile = `${dir}/${extensionless}`;
			// only add extensionless when there's no exports field
			if (!hasExports && !hasOwn(packageExports || {}, extlessFile)) {
				safeSet(tree.require, extlessFile, realFile);
			}
		}
	}

	if (canRequire || canImport) {
		tree.files.add(realFile);
	}
}

function newTree() {
	return {
		import: new Map(),
		require: new Map(),
		files: new Set(),
		tree: new Map(),
		hasDirSlash: null, // will be deleted
	};
}

async function traverseDir(
	dir,
	rootDir,
	filteredFiles,
	mains,
	packageExports,
	options = {},
	tree = newTree(),
) {
	const subFiles = new Set();
	const subDirs = new Set();
	forEach(
		filter(
			arrayFrom(filteredFiles, (file) => `./${file}`),
			(file) => startsWith(file, `${dir}/`),
		),
		(file) => {
			const subFile = $replace(file, `${dir}/`, '');
			const subFileParts = $split(subFile, pathSep);
			// ignore published files inside a node_modules dir
			if (!includes(subFileParts, 'node_modules')) {
				if (includes(subFile, pathSep)) {
					subDirs.add(subFileParts[0]);
				} else {
					subFiles.add(file);
				}
			}
		},
	);

	const dirMain = mains.get(dir);
	if (dirMain) {
		const fullDirMain = pathJoin(rootDir, dir, dirMain);
		const canRequire = isCJS(fullDirMain, options.useType, options.nodeRange);
		const canImport = options.useType && isESM(fullDirMain, options.nodeRange);

		if (canImport) {
			safeSet(tree.import, dir, dirMain);
		}

		if (canRequire) {
			safeSet(tree.require, dir, dirMain);
			const dirSlash = `${dir}/`;
			safeSet(tree.require, dirSlash, dirMain);
		}
	}

	await asyncForEach(arrayFrom(subFiles), (file) => forEachSubfile(file, {
		dir,
		options,
		rootDir,
		mains,
		tree,
		packageExports,
	}));

	// build up the tree structure, from all included files
	tree.files.forEach((file) => {
		const parts = $split(file, '/');
		reduce(parts, (acc, part, i) => {
			if (part === '.') {
				return acc.tree;
			}
			const isLastPart = i + 1 === parts.length;
			safeSet(acc, part, isLastPart ? new Set() : new Map());
			return acc.get(part);
		}, tree);
	});

	function addToTree(file, specifier) {
		const parts = $split(file, '/');
		reduce(parts, (acc, part, i) => {
			if (part === '.') {
				return acc.tree;
			}
			const isLastPart = i + 1 === parts.length;
			if (!acc.has(part)) {
				safeSet(acc, part, isLastPart ? new Set() : new Map());
			}
			const item = acc.get(part);
			if (isLastPart) {
				item.add(specifier);
			}
			return item;
		}, tree);
	}
	tree.require.forEach(addToTree);
	tree.import.forEach(addToTree);

	await $all(arrayFrom(subDirs, (subDir) => traverseDir(
		`./${pathJoin(dir, subDir)}`,
		rootDir,
		filteredFiles,
		mains,
		packageExports,
		options,
		tree,
	)));

	return sortFiles(tree);
}

function addMainString(string, packageDir, tree, nodeRange) {
	const main = `./${pathNormalize(string)}`;
	const fullMain = pathJoin(packageDir, main);
	if (existsSync(fullMain)) {
		const resolved = `./${pathRelative(packageDir, fullMain)}`;
		if (isESM(main, nodeRange)) {
			if (!tree.import.has(main)) {
				safeSet(tree.import, '.', resolved);
				tree.files.add(main);
			}
		} else if (isCJS(main, true, nodeRange)) {
			if (!tree.import.has(main)) {
				safeSet(tree.import, '.', resolved);
				tree.files.add(main);
			}
			if (!tree.require.has(main)) {
				safeSet(tree.require, '.', resolved);
				tree.files.add(main);
			}
		}
	}
}

function supportsRequireESM(category) {
	const conditions = getConditionsForCategory(category);
	return conditions && includes(conditions, 'module-sync');
}

function addFullPath(
	packageDir,
	category,
	tree,
	lhs,
	rhs,
	conditionChain,
	problems,
	filteredFiles,
	nodeRange,
) {
	if (startsWith(rhs, './')) {
		const fullPath = pathJoin(packageDir, rhs);
		if (filteredFiles.has($replace(rhs, /^\.\//, '')) && existsSync(fullPath)) {
			const ext = extname(fullPath);
			const requiresESM = supportsRequireESM(category);
			const canRequire = (
				requiresESM // require(esm) categories can require .mjs and ESM .js
				|| (
					ext !== '.mjs'
					&& (
						!isESM(fullPath, nodeRange) // not type module
						|| ext !== '.js' // not .js
					)
				)
			)
				&& !includes(conditionChain, 'import')
				&& !(/(?:^|\/)node_modules(?:\/|$)/).test(rhs);
			const canImport = category !== 'broken'
				&& ext !== '.json'
				&& ext !== '.node'
				&& !includes(conditionChain, 'require')
				&& !(/(?:^|\/)node_modules(?:\/|$)/).test(rhs);
			if (canImport) {
				safeSet(tree.import, lhs, rhs);
			}
			if (canRequire) {
				safeSet(tree.require, lhs, rhs);
			}
			if (tree.import.get(lhs) === rhs || tree.require.get(lhs) === rhs) {
				tree.files.add(rhs);
			}

			return true;
		}
		problems.add(`“${lhs}”: ${rhs} does not appear to exist!`);
	} else {
		problems.add(`\`exports[${lhs}]\`: ${rhs} must start with \`./\``);
	}
	return false;
}

function hasDirSlash(category) {
	return category !== 'broken-dir-slash-conditions' && category !== 'patterns' && category !== 'pattern-trailers-no-dir-slash';
}

function traverseExportsSubtree({
	tree,
	subtree,
	problems,
	packageDir,
	packageExports,
	mains,
	dir,
	lhs,
	rhs,
	category,
}) {
	subtree.forEach((value, key) => {
		if (value instanceof Set) {
			// it's a file

			const relativeFilePath = `./${pathJoin(dir, key)}`;
			const replacedFilePath = $replace(relativeFilePath, lhs, rhs);

			forEachSubfile(relativeFilePath, {
				dir,
				options: {
					useType: true,
					skipMainDot: true,
					skipDirSlash: !hasDirSlash(category),
				},
				rootDir: packageDir,
				mains,
				tree,
				packageExports,
			}, replacedFilePath);
		} else if (value instanceof Map) {
			// it's a dir
			traverseExportsSubtree({
				tree,
				subtree: value,
				problems,
				packageDir,
				packageExports,
				mains,
				dir: `./${pathJoin(dir, key)}`,
				lhs,
				rhs,
				category,
			});
		} else {
			throw new TypeError('tree has a non-collection value!');
		}
	});
}

function traverseExportsSubdir({
	packageDir,
	packageExports,
	lhs,
	rhs,
	problems,
	tree,
	legacy,
	mains,
	category,
}) {
	const fullRHS = pathJoin(packageDir, rhs);

	// traverse into rhs, mapping paths to lhs
	if (!existsSync(fullRHS)) {
		problems.add(`\`${lhs}\`: \`${rhs}\` does not appear to exist!`);
	} else if (!isDirectory(fullRHS)) {
		problems.add(`\`${lhs}\`: \`${rhs}\` is not a directory!`);
	} else {
		const subtree = rhs === './' ? legacy.tree : legacy.tree.get(rhs);
		if (subtree) {
			traverseExportsSubtree({
				tree,
				subtree,
				problems,
				packageDir,
				packageExports,
				mains,
				dir: '.',
				lhs,
				rhs,
				category,
			});
		}
	}
}

async function forEachExportEntry([lhs, maybeRHS], conditionChain, {
	packageDir,
	packageExports,
	problems,
	category,
	conditions,
	tree,
	legacy,
	filteredFiles,
	mains,
	nodeRange,
}) {
	return asyncReduce($concat([], maybeRHS), async (prev, rhs) => {
		if (await prev) {
			return true;
		}
		if (rhs === null) {
			// null exports explicitly exclude this subpath
			safeSet(tree.import, lhs, false);
			safeSet(tree.require, lhs, false);
			return false;
		}
		if (typeof rhs === 'string') {
			rhs = decodeURI(rhs); // eslint-disable-line no-param-reassign
			if (endsWith(lhs, '/') && endsWith(rhs, '/')) {
				if (category === 'pattern-trailers-no-dir-slash') {
					return false;
				}
				tree.hasDirSlash = true; // eslint-disable-line no-param-reassign
				traverseExportsSubdir({
					packageDir,
					packageExports,
					lhs,
					rhs,
					problems,
					tree,
					legacy,
					mains,
					category,
				});
				return true;
			}
			return addFullPath(
				packageDir,
				category,
				tree,
				lhs,
				rhs,
				conditionChain,
				problems,
				filteredFiles,
				nodeRange,
			);
		}
		const rhsResults = validateExportsObject(rhs);
		rhsResults.problems.forEach((problem) => {
			problems.add(problem);
		});

		if (rhsResults.status === 'files') {
			problems.add('`./package.json`: inside a conditions object, a files object (keys starting with `.`) is invalid');
			return false;
		}
		if (category !== 'broken') {
			const validConditionEntries = filter(entries(rhs), ([x]) => conditions.has(x));
			if (validConditionEntries.length === 0) {
				safeSet(tree.import, lhs, false);
				safeSet(tree.require, lhs, false);
				return false;
			}

			return asyncReduce(validConditionEntries, (matchedSomething, [condition, conditionRHS]) => {
				if (conditionRHS === null) {
					// null in a condition explicitly excludes this path for this condition
					if (condition === 'import' || !includes(conditionChain, 'require')) {
						safeSet(tree.import, lhs, false);
					}
					if (condition === 'require' || !includes(conditionChain, 'import')) {
						safeSet(tree.require, lhs, false);
					}
					return matchedSomething;
				}
				if (typeof conditionRHS === 'string') {
					if (endsWith(lhs, '/') && endsWith(conditionRHS, '/')) {
						return traverseExportsSubdir({
							packageDir,
							packageExports,
							lhs,
							rhs: conditionRHS,
							problems,
							tree,
							legacy,
							mains,
						});
					}
					return addFullPath(
						packageDir,
						category,
						tree,
						lhs,
						conditionRHS,
						conditionChain.concat(condition),
						problems,
						filteredFiles,
						nodeRange,
					) || matchedSomething;
				}
				return forEachExportEntry([lhs, conditionRHS], $concat(conditionChain, condition), {
					packageDir,
					packageExports,
					problems,
					category,
					conditions,
					tree,
					legacy,
					filteredFiles,
					mains,
					nodeRange,
				}) || matchedSomething;
			}, false);
		}

		return false;
	}, false);
}

async function traverseExports(category, packageDir, pkgData, filteredFiles, legacy, mains, problems, nodeRange) {
	const tree = newTree();

	function addToTree(file, specifier) {
		if (file !== false) {
			const parts = $split(file, '/');
			reduce(parts, (acc, part, i) => {
				if (part === '.') {
					return acc.tree;
				}
				let item = acc.get(part);
				if (i + 1 === parts.length) {
					if (!item) {
						item = new Set();
					}
					item.add(specifier);
				} else if (!item) {
					item = new Map();
				}
				safeSet(acc, part, item);
				return item;
			}, tree);
		}
	}

	const conditions = new Set(getConditionsForCategory(category));

	if (typeof pkgData.exports === 'string') {
		addMainString(pkgData.exports, packageDir, tree, nodeRange);
	} else {
		// handle array fallback for main
		const exportValues = flat($concat([], pkgData.exports), Infinity);

		await asyncReduce(exportValues, async (prev, value) => { // TODO: fixtures for nested arrays in "broken"
			if (await prev) {
				return true;
			}
			if (typeof value === 'string') {
				addMainString(value, packageDir, tree, nodeRange);
				return true;
			}
			if (value && typeof value === 'object') {
				const topLevelResults = validateExportsObject(value);
				topLevelResults.problems.forEach((problem) => {
					problems.add(problem);
				});

				if (topLevelResults.status === 'empty') {
					return false;
				}

				if (topLevelResults.status === 'conditions') {
					if (category === 'broken') {
						safeSet(tree.import, '.', false);
						safeSet(tree.require, '.', false);
						return false;
					}
					return forEachExportEntry(['.', value], [], {
						packageDir,
						packageExports: pkgData.exports,
						problems,
						category,
						conditions,
						tree,
						legacy,
						filteredFiles,
						mains,
						nodeRange,
					});
				}

				if (topLevelResults.status !== 'files') {
					console.error({ topLevelResults });
					throw new TypeError(`unknown top-level exports object type found: ${topLevelResults.status}`);
				}

				return asyncForEach(
					entries(value),
					([lhs, rhs]) => {
						const matched = forEachExportEntry([lhs, rhs], [], {
							packageDir,
							packageExports: pkgData.exports,
							problems,
							category,
							conditions,
							tree,
							legacy,
							filteredFiles,
							mains,
							nodeRange,
						});
						if (!matched) {
							safeSet(tree.import, lhs, false);
							safeSet(tree.require, lhs, false);
						}
					},
				);
			}
			return false;
		}, false);
	}

	tree.require.forEach(addToTree);
	tree.import.forEach(addToTree);

	return sortFiles(tree);
}
async function traverseMains(rootDir, filteredFiles, extensions, problems) {
	// first pass: get every dir and its alleged main
	const dirs = new Map(await $all(arrayFrom(
		new Set(arrayFrom(filteredFiles, (file) => dirname(`./${file}`))),
		async (dir) => [dir, await getMain(rootDir, dir, extensions, problems)],
	)));
	// second pass: any alleged main that points to a dir, remap it to an actual main
	return new Map(filter(
		arrayFrom(dirs, ([dir, maybeMain]) => {
			const found = maybeMain && dirs.get($replace(maybeMain, /\/?$/, ''));
			return [dir, found && endsWith(found, '/') ? `./${pathJoin(found, 'index.js')}` : found || maybeMain];
		}),
		([, x]) => x,
	));
}

async function getExports(packageDir, pkgData, nodeRange, problems) {
	const {
		type: rootType = 'commonjs',
	} = pkgData;

	const { all: rootAllExtensions, base: rootBaseExtensions } = getExtensions(rootType, nodeRange);
	const arborist = new Arborist({ path: packageDir });
	const arbTree = await arborist.loadActual();
	const packedFiles = await packlist(arbTree, { path: packageDir });
	/* eslint function-paren-newline: 0 */
	const filteredFiles = new Set(
		$sort(
			filter(
				flatMap(
					packedFiles,
					(x) => {
						const resolved = resolveFrom(dirname(x), packageDir, rootAllExtensions);
						return [
							x,
							resolved && pathRelative(packageDir, resolved),
						];
					},
				),
				(x) => x && some(rootAllExtensions, (ext) => endsWith(x, ext)),
			),
		),
	);

	const mains = await traverseMains(packageDir, filteredFiles, rootBaseExtensions, problems);

	const legacyP = traverseDir('.', packageDir, filteredFiles, mains, {}, { nodeRange });

	const categories = getCategoriesForRange(nodeRange);
	const [latest] = categories;

	const binaryEntries = typeof pkgData.bin === 'string'
		? [[pkgData.name, pkgData.bin]]
		: entries(pkgData.bin || {});
	const binaries = fromEntries(flatMap(binaryEntries, ([n, p]) => {
		const resolved = resolveFrom($replace(p, /^(?:\.\/)?/, './'), packageDir, $concat('', rootAllExtensions));
		if (resolved) {
			const relativeBin = `./${pathRelative(packageDir, resolved)}`;
			return [[n, relativeBin]];
		}
		return [];
	}));

	if (categories.length === 1 && latest === 'pre-exports') {
		return {
			binaries,
			latest,
			[latest]: await legacyP,
		};
	}

	if (!('exports' in pkgData)) {
		const [
			postExports,
			preExports,
		] = await $all([
			traverseDir('.', packageDir, filteredFiles, mains, pkgData.exports, { useType: true, nodeRange }),
			legacyP,
		]);

		return {
			binaries,
			latest: 'conditions',
			conditions: postExports,
			'pre-exports': preExports,
		};
	}

	// traverse "exports", respect "type" field, etc

	const legacy = await legacyP;
	const categoryExports = await $all(map(categories, async (category) => [
		category,
		category === 'pre-exports'
			? legacy
			: await traverseExports(category, packageDir, pkgData, filteredFiles, legacy, mains, problems, nodeRange),
	]));

	return {
		binaries,
		latest,
		...fromEntries(categoryExports),
		'pre-exports': legacy,
	};
}

module.exports = async function listExports(packageJSON, options = {}) {
	const packageJSONpath = realpathSync(packageJSON);
	const packageDir = dirname(packageJSONpath);

	const pkgData = await readPackage(packageJSON);
	const {
		name,
		version,
		private: isPrivate,
		engines = { node: '*' },
	} = pkgData;

	let node = process.version;

	if (options.node === true) {
		({ node } = engines);
		if (!validRange(node)) {
			throw new RangeError('when the provided node version is `true`, this package’s `engines.node` declaration must be a valid semver range');
		}
	} else if ('node' in options) {
		if (!validRange(options.node)) {
			throw new RangeError('`node` option must be `true`, or a valid semver range');
		}
		({ node } = options);
	}

	const problems = new Set();

	if (!intersects(engines.node || '*', node)) {
		problems.add('node' in options
			? `the provided node version (${node}) does not match the package’s \`engines.node\` declaration (${engines.node || '*'})`
			: `the current node version (${node}) does not match the package’s \`engines.node\` declaration (${engines.node || '*'})`);
	}

	if (isPrivate) {
		return {
			name,
			version,
			private: !!isPrivate,
			problems: new Set($sort(arrayFrom(problems), stringSort)),
		};
	}

	const exports = await getExports(packageDir, pkgData, node, problems);

	return {
		name,
		version,
		engines: {
			node: '*',
			...engines,
		},
		problems: new Set($sort(arrayFrom(problems), stringSort)),
		exports,
	};
};

// Map/Set has/add/get/set
