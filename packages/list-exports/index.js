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

const PackageJson = require('@npmcli/package-json');
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
const $all = /** @type {<T>(values: Iterable<T | PromiseLike<T>>) => Promise<T[]>} */ (
	/** @type {unknown} */ (callBind(GetIntrinsic('%Promise.all%'), Promise))
);

/** @typedef {import('.').Category} Category */
/** @typedef {import('.').Tree} Tree */
/** @typedef {import('.').CategoryExports} CategoryExports */
/** @typedef {import('@npmcli/package-json').Content & { name: string, version: string }} PackageData */
/** @typedef {Set<string>} Problems */
/** @typedef {Map<string, string>} Mains */
/** @typedef {{ all: string[], base: string[], esm: string[], legacy: string[] }} Extensions */
/** @typedef {{ useType?: boolean, skipMainDot?: boolean, skipDirSlash?: boolean, nodeRange?: string }} TraverseOptions */
/**
 * The mutable tree built up during traversal. `sortFiles` turns it into a
 * `CategoryExports`, dropping `hasDirSlash` and the `false` (null-export) values.
 * @typedef {{
 *   import: Map<string, string | false>,
 *   require: Map<string, string | false>,
 *   files: Set<string>,
 *   tree: Tree,
 *   hasDirSlash: boolean | null,
 * }} WorkingTree
 */
/**
 * Walking a path down the tree starts at the `WorkingTree` (whose `.tree` holds
 * the root Map), then descends through `Tree` nodes to a `Set` of specifiers.
 * @typedef {WorkingTree | Tree | Set<string>} TreeCursor
 */

/** @param {string} file */
function isDirectory(file) {
	try {
		return lstatSync(file).isDirectory();
	} catch {
		return false;
	}
}

/**
 * @param {string} file
 * @param {string} basedir
 * @param {readonly string[]} extensions
 * @returns {string | null}
 */
function resolveFrom(file, basedir, extensions) {
	try {
		return resolve.sync(file, { basedir, extensions });
	} catch {
		return null;
	}
}

/**
 * @param {string} a
 * @param {string} b
 */
function stringSort(a, b) {
	return $localeCompare(a, b);
}

/**
 * @param {Tree} treeMap
 * @returns {Tree}
 */
function sortTree(treeMap) {
	return new Map(sortPaths(
		arrayFrom(treeMap, ([k, v]) => /** @type {[string, Set<string> | Tree]} */ (
			[k, v instanceof Map ? sortTree(v) : v]
		)),
		([a]) => a,
		'/',
	));
}

/**
 * @param {WorkingTree} tree
 * @returns {CategoryExports}
 */
function sortFiles(tree) {
	return /** @type {CategoryExports} */ (fromEntries(flatMap(entries(tree), ([k, v]) => {
		if (k === 'hasDirSlash') {
			return [];
		}
		if (k === 'files') {
			return [[k, new Set(sortPaths(filter(arrayFrom(/** @type {Set<string>} */ (v)), Boolean), '/'))]];
		}
		if (k === 'require' || k === 'import') {
			return [[k, new Map(sortPaths(filter(arrayFrom(/** @type {Map<string, string | false>} */ (v)), ([, vv]) => vv), ([a]) => a, '/'))]];
		}
		if (k === 'tree') {
			return [[k, sortTree(/** @type {Tree} */ (v))]];
		}
		return [[k, v]];
	})));
}

// Node 22.6.0+ has native TypeScript support (type stripping)
// Use subset to ensure the ENTIRE range supports native TS, not just part of it
/** @param {string} nodeRange */
function hasNativeTS(nodeRange) {
	return subset(nodeRange, '>=22.6');
}

/**
 * @param {string} [packageType]
 * @param {string} [nodeRange]
 * @returns {Extensions}
 */
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

/**
 * @param {string} filename
 * @param {boolean} [usingExports]
 * @param {string} [nodeRange]
 */
function isCJS(filename, usingExports = false, nodeRange = process.version) {
	const packageType = getPackageType(filename);
	if (packageType !== 'commonjs' && packageType !== 'module') {
		throw new TypeError(`unknown package type found: ${inspect(packageType)}`);
	}
	if (extname(filename) === '.cjs') {
		// `.cjs` is always CommonJS, but node handles it natively so it never appears in `require.extensions`
		return true;
	}
	const { base, legacy } = getExtensions(packageType, nodeRange);
	return includes(usingExports ? base : legacy, extname(filename));
}

/**
 * @param {string} filename
 * @param {string} [nodeRange]
 */
function isESM(filename, nodeRange = process.version) {
	const packageType = getPackageType(filename);
	if (packageType !== 'commonjs' && packageType !== 'module') {
		throw new TypeError(`unknown package type found: ${inspect(packageType)}`);
	}
	const { esm } = getExtensions(packageType, nodeRange);
	return includes(esm, extname(filename));
}

/**
 * @param {string} packageJSON
 * @returns {Promise<PackageData>}
 */
async function readPackage(packageJSON) {
	const { content } = await PackageJson.normalize(dirname(packageJSON));
	// `read-package-json` rejected a truthy non-string `main` (but allowed `false`/`null`); `@npmcli/package-json` does not, so preserve that
	if (content.main && typeof content.main !== 'string') {
		throw new TypeError('`main` must be a string');
	}
	return /** @type {PackageData} */ (content);
}

/**
 * `task` returning `void` leaves the accumulator `undefined` for the remaining
 * items; some callers below rely on that, so it is permitted here.
 * @template T, U
 * @param {ArrayLike<T>} items
 * @param {(prev: U, value: T) => U | void | Promise<U | void>} task
 * @param {U} [initial]
 * @returns {Promise<U>}
 */
async function asyncReduce(items, task, initial = void undefined) {
	return reduce(
		items,
		/** @type {(prev: U | Promise<U>, value: T) => U | Promise<U>} */
		(async (prev, value) => task(await prev, value)),
		/** @type {U | Promise<U>} */ (initial),
	);
}

/**
 * @template T, U
 * @param {ArrayLike<T>} items
 * @param {(item: T) => U | Promise<U>} task
 * @returns {Promise<U>}
 */
async function asyncForEach(items, task) {
	return asyncReduce(
		items,
		async (_prev, item) => task(item),
	);
}

/**
 * @param {string} rootDir
 * @param {string} dir
 * @param {readonly string[]} extensions
 * @param {Problems} problems
 * @returns {Promise<string | null>}
 */
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
		const fullMain = resolveFrom(/** @type {string} */ (main), fullDir, extensions);
		const fullMainExists = !!fullMain && existsSync(fullMain);

		if (fullMainExists) {
			return `./${pathRelative(rootDir, fullMain)}`;
		}
	}

	const indexMain = resolveFrom('./index.js', fullDir, extensions);
	if (indexMain && existsSync(indexMain)) {
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

/**
 * @template K, V
 * @param {Map<K, V>} mapInstance
 * @param {K} key
 * @param {V} newVal
 */
function safeSet(mapInstance, key, newVal) {
	if (!mapInstance.has(key)) {
		mapInstance.set(key, newVal);
	}
}

/**
 * @param {string} realFile
 * @param {{
 *   dir: string,
 *   options: TraverseOptions,
 *   rootDir: string,
 *   mains: Mains | undefined,
 *   tree: WorkingTree,
 *   packageExports: unknown,
 * }} context
 * @param {string} [fakeFile]
 */
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

/** @returns {WorkingTree} */
function newTree() {
	return {
		import: new Map(),
		require: new Map(),
		files: new Set(),
		tree: new Map(),
		hasDirSlash: null, // will be deleted
	};
}

/**
 * @param {string} dir
 * @param {string} rootDir
 * @param {Set<string>} filteredFiles
 * @param {Mains} mains
 * @param {unknown} packageExports
 * @param {TraverseOptions} [options]
 * @param {WorkingTree} [tree]
 * @returns {Promise<CategoryExports>}
 */
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
		reduce(parts, /** @type {(acc: TreeCursor, part: string, i: number) => TreeCursor} */ ((acc, part, i) => {
			if (part === '.') {
				return /** @type {WorkingTree} */ (acc).tree;
			}
			const isLastPart = i + 1 === parts.length;
			const node = /** @type {Tree} */ (acc);
			safeSet(node, part, isLastPart ? new Set() : new Map());
			return /** @type {TreeCursor} */ (node.get(part));
		}), tree);
	});

	/**
	 * @param {string} file
	 * @param {string} specifier
	 */
	function addToTree(file, specifier) {
		const parts = $split(file, '/');
		reduce(parts, /** @type {(acc: TreeCursor, part: string, i: number) => TreeCursor} */ ((acc, part, i) => {
			if (part === '.') {
				return /** @type {WorkingTree} */ (acc).tree;
			}
			const isLastPart = i + 1 === parts.length;
			const node = /** @type {Tree} */ (acc);
			if (!node.has(part)) {
				safeSet(node, part, isLastPart ? new Set() : new Map());
			}
			const item = /** @type {TreeCursor} */ (node.get(part));
			if (isLastPart) {
				/** @type {Set<string>} */ (item).add(specifier);
			}
			return item;
		}), tree);
	}
	tree.require.forEach(/** @type {(file: string | false, specifier: string) => void} */ (addToTree));
	tree.import.forEach(/** @type {(file: string | false, specifier: string) => void} */ (addToTree));

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

/**
 * @param {string} string
 * @param {string} packageDir
 * @param {WorkingTree} tree
 * @param {string} nodeRange
 */
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

/** @param {Category} category */
function supportsRequireESM(category) {
	const conditions = getConditionsForCategory(category);
	return conditions && includes(conditions, 'module-sync');
}

/**
 * @param {string} packageDir
 * @param {Category} category
 * @param {WorkingTree} tree
 * @param {string} lhs
 * @param {string} rhs
 * @param {readonly string[]} conditionChain
 * @param {Problems} problems
 * @param {Set<string>} filteredFiles
 * @param {string} nodeRange
 */
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

/** @param {Category} [category] */
function hasDirSlash(category) {
	return category !== 'broken-dir-slash-conditions' && category !== 'patterns' && category !== 'pattern-trailers-no-dir-slash';
}

/**
 * @param {{
 *   tree: WorkingTree,
 *   subtree: Tree,
 *   problems: Problems,
 *   packageDir: string,
 *   packageExports: unknown,
 *   mains: Mains | undefined,
 *   dir: string,
 *   lhs: string,
 *   rhs: string,
 *   category?: Category,
 * }} context
 */
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

/**
 * @param {{
 *   packageDir: string,
 *   packageExports: unknown,
 *   lhs: string,
 *   rhs: string,
 *   problems: Problems,
 *   tree: WorkingTree,
 *   legacy: CategoryExports,
 *   mains: Mains | undefined,
 *   category?: Category,
 * }} context
 */
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
		const subtree = /** @type {Tree | undefined} */ (rhs === './' ? legacy.tree : legacy.tree.get(rhs));
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

/**
 * @param {[string, unknown]} entry
 * @param {readonly string[]} conditionChain
 * @param {{
 *   packageDir: string,
 *   packageExports: unknown,
 *   problems: Problems,
 *   category: Category,
 *   conditions: Set<string>,
 *   tree: WorkingTree,
 *   legacy: CategoryExports,
 *   filteredFiles: Set<string>,
 *   mains: Mains | undefined,
 *   nodeRange: string,
 * }} context
 * @returns {Promise<boolean>}
 */
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
			try {
				rhs = decodeURI(rhs); // eslint-disable-line no-param-reassign
			} catch {
				// if decodeURI fails (malformed URI), Node will throw at runtime
				problems.add(`\`${lhs}\`: target "${rhs}" contains an invalid URL escape sequence`);
				return false;
			}
			if (endsWith(lhs, '/') && endsWith(/** @type {string} */ (rhs), '/')) {
				if (category === 'pattern-trailers-no-dir-slash') {
					return false;
				}
				tree.hasDirSlash = true; // eslint-disable-line no-param-reassign
				traverseExportsSubdir({
					packageDir,
					packageExports,
					lhs,
					rhs: /** @type {string} */ (rhs),
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
				/** @type {string} */ (rhs),
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
			const validConditionEntries = filter(entries(/** @type {object} */ (rhs)), ([x]) => conditions.has(x));
			if (validConditionEntries.length === 0) {
				safeSet(tree.import, lhs, false);
				safeSet(tree.require, lhs, false);
				return false;
			}

			/** @typedef {(matchedSomething: boolean, entry: [string, unknown]) => boolean | void | Promise<boolean>} ConditionReducer */
			return /** @type {Promise<boolean>} */ (asyncReduce(
				validConditionEntries,
				/** @type {ConditionReducer} */ ((matchedSomething, [condition, conditionRHS]) => {
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
							// node 17+ removed trailing-slash folder mappings; the top-level string branch guards this, so the conditional branch must too
							if (category === 'pattern-trailers-no-dir-slash') {
								return matchedSomething;
							}
							return traverseExportsSubdir({
								packageDir,
								packageExports,
								lhs,
								rhs: conditionRHS,
								problems,
								tree,
								legacy,
								mains,
								category,
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
				}),
				false,
			));
		}

		return false;
	}, false);
}

/**
 * @param {Category} category
 * @param {string} packageDir
 * @param {PackageData} pkgData
 * @param {Set<string>} filteredFiles
 * @param {CategoryExports} legacy
 * @param {Mains} mains
 * @param {Problems} problems
 * @param {string} nodeRange
 * @param {readonly string[] | null} customConditions
 * @returns {Promise<CategoryExports>}
 */
async function traverseExports(
	category,
	packageDir,
	pkgData,
	filteredFiles,
	legacy,
	mains,
	problems,
	nodeRange,
	customConditions,
) {
	const tree = newTree();

	/**
	 * @param {string | false} file
	 * @param {string} specifier
	 */
	function addToTree(file, specifier) {
		if (file !== false) {
			const parts = $split(file, '/');
			reduce(parts, /** @type {(acc: TreeCursor, part: string, i: number) => TreeCursor} */ ((acc, part, i) => {
				if (part === '.') {
					return /** @type {WorkingTree} */ (acc).tree;
				}
				const node = /** @type {Tree} */ (acc);
				let item = node.get(part);
				if (i + 1 === parts.length) {
					if (!item) {
						item = new Set();
					}
					/** @type {Set<string>} */ (item).add(specifier);
				} else if (!item) {
					item = new Map();
				}
				safeSet(node, part, item);
				return item;
			}), tree);
		}
	}

	/** @type {Set<string>} */
	const conditions = new Set(getConditionsForCategory(category));
	// add custom conditions (like Node's --conditions flag)
	if (customConditions) {
		forEach(customConditions, (c) => conditions.add(c));
	}

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
/**
 * @param {string} rootDir
 * @param {Set<string>} filteredFiles
 * @param {readonly string[]} extensions
 * @param {Problems} problems
 * @returns {Promise<Mains>}
 */
async function traverseMains(rootDir, filteredFiles, extensions, problems) {
	// first pass: get every dir and its alleged main
	const dirs = new Map(await $all(arrayFrom(
		new Set(arrayFrom(filteredFiles, (file) => dirname(`./${file}`))),
		async (dir) => /** @type {[string, string | null]} */ (
			[dir, await getMain(rootDir, dir, extensions, problems)]
		),
	)));
	// second pass: any alleged main that points to a dir, remap it to an actual main
	return new Map(filter(
		arrayFrom(dirs, ([dir, maybeMain]) => {
			const found = maybeMain && dirs.get($replace(maybeMain, /\/?$/, ''));
			return /** @type {[string, string]} */ ([dir, found && endsWith(found, '/') ? `./${pathJoin(found, 'index.js')}` : found || maybeMain]);
		}),
		([, x]) => x,
	));
}

/**
 * @param {string} packageDir
 * @param {PackageData} pkgData
 * @param {string} nodeRange
 * @param {Problems} problems
 * @param {readonly string[] | null} customConditions
 * @returns {Promise<import('.').Exports>}
 */
async function getExports(packageDir, pkgData, nodeRange, problems, customConditions) {
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

	const binaryEntries = /** @type {[string, string][]} */ (typeof pkgData.bin === 'string'
		? [[pkgData.name, pkgData.bin]]
		: entries(pkgData.bin || {}));
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
	const categoryExports = await $all(map(categories, async (category) => /** @type {[Category, CategoryExports]} */ ([
		category,
		category === 'pre-exports'
			? legacy
			: await traverseExports(
				category,
				packageDir,
				pkgData,
				filteredFiles,
				legacy,
				mains,
				problems,
				nodeRange,
				customConditions,
			),
	])));

	return {
		binaries,
		latest,
		...fromEntries(categoryExports),
		'pre-exports': legacy,
	};
}

/** @type {typeof import('.')} */
module.exports = async function listExports(packageJSON, options = {}) {
	const packageJSONpath = realpathSync(packageJSON);
	const packageDir = dirname(packageJSONpath);

	const pkgData = await readPackage(packageJSON);
	const {
		name,
		version,
		private: isPrivate,
		engines: rawEngines,
	} = pkgData;
	// a destructuring default only covers `undefined`; `"engines": null` must fall back too
	const engines = rawEngines || { node: '*' };

	let node = process.version;

	if (options.node === true) {
		({ node } = /** @type {{ node: string }} */ (engines));
		if (!validRange(node)) {
			throw new RangeError('when the provided node version is `true`, this package’s `engines.node` declaration must be a valid semver range');
		}
	} else if ('node' in options) {
		if (!validRange(options.node)) {
			throw new RangeError('`node` option must be `true`, or a valid semver range');
		}
		({ node } = /** @type {{ node: string }} */ (options));
	}

	const problems = new Set();

	if (!intersects(engines.node || '*', node)) {
		problems.add('node' in options
			? `the provided node version (${node}) does not match the package's \`engines.node\` declaration (${engines.node || '*'})`
			: `the current node version (${node}) does not match the package's \`engines.node\` declaration (${engines.node || '*'})`);
	}

	// validate and process custom conditions (like Node's --conditions flag)
	let customConditions = null;
	if ('conditions' in options) {
		const rawConditions = options.conditions;
		if (rawConditions === true) {
			// auto-detect from Node's --conditions flag (execArgv or NODE_OPTIONS)
			customConditions = [];
			// check process.execArgv for --conditions=X or -C X
			forEach(process.execArgv, (arg, i) => {
				if (startsWith(arg, '--conditions=')) {
					customConditions.push($replace(arg, /^--conditions=/, ''));
				} else if (startsWith(arg, '-C=')) {
					customConditions.push($replace(arg, /^-C=/, ''));
				} else if ((arg === '--conditions' || arg === '-C') && process.execArgv[i + 1]) {
					customConditions.push(process.execArgv[i + 1]);
				}
			});
			// check NODE_OPTIONS environment variable
			const nodeOpts = process.env.NODE_OPTIONS || '';
			if (nodeOpts) {
				const optsParts = $split(nodeOpts, /\s+/);
				forEach(optsParts, (arg, i) => {
					if (startsWith(arg, '--conditions=')) {
						customConditions.push($replace(arg, /^--conditions=/, ''));
					} else if (startsWith(arg, '-C=')) {
						customConditions.push($replace(arg, /^-C=/, ''));
					} else if ((arg === '--conditions' || arg === '-C') && optsParts[i + 1]) {
						customConditions.push(optsParts[i + 1]);
					}
				});
			}
			if (customConditions.length === 0) {
				customConditions = null;
			}
		} else {
			if (!Array.isArray(rawConditions) && typeof rawConditions !== 'string') {
				throw new TypeError('`conditions` option must be `true`, a string, or an array of strings');
			}
			customConditions = $concat([], rawConditions);
			if (some(customConditions, (c) => typeof c !== 'string' || c.length === 0)) {
				throw new TypeError('`conditions` option must contain only non-empty strings');
			}
		}
		if (customConditions) {
			customConditions = arrayFrom(new Set(customConditions));
		}
	}

	if (isPrivate) {
		return {
			name,
			version,
			private: !!isPrivate,
			problems: new Set($sort(arrayFrom(problems), stringSort)),
		};
	}

	const exports = await getExports(packageDir, pkgData, node, problems, customConditions);

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
