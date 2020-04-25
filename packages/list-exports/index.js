'use strict';

const fs = require('fs');
const path = require('path');
const readPackageJSON = require('read-package-json');
const entries = require('object.entries');
const flatMap = require('array.prototype.flatmap');
const resolve = require('resolve');
const packlist = require('npm-packlist');

/* eslint-disable no-inner-declarations */

function isDirectory(file) {
	try {
		return fs.lstatSync(file).isDirectory();
	} catch (e) {
		return false;
	}
}

function resolveFrom(file, basedir, extensions) {
	try {
		return resolve.sync(file, { basedir, extensions });
	} catch (e) {
		return null;
	}
}

function traverseDir(
	dir,
	usingExports,
	{
		extensions,
		filteredFiles,
		packageDir,
		process,
		addError,
	},
) {
	const slicedDir = dir.slice(packageDir.length + 1);
	const dirRelative = slicedDir && `./${slicedDir}`;
	const dirMain = resolveFrom('./', dir, extensions);
	if (dirMain) {
		const mainFile = `./${dirMain.slice(packageDir.length + 1)}`;
		process(dirRelative, {
			isMain: true,
			file: mainFile,
			usingExports,
		});
	} else if (fs.existsSync(path.join(dir, 'package.json'))) {
		addError(`\`${dirRelative}\` has a \`package.json\`, but either lacks a \`main\`, or its \`main\` is invalid!`);
	}

	const contents = fs.readdirSync(dir);

	const files = contents.filter((x) => filteredFiles.has(path.join(dir.slice(packageDir.length + 1), x)));
	files.forEach((file) => {
		const pkgRelativeFilename = `./${path.join(dirRelative, file)}`;
		process(dirRelative, {
			isMain: false,
			file: pkgRelativeFilename,
			usingExports,
		});
	});

	const dirs = contents.filter((x) => x !== 'node_modules'
		&& isDirectory(path.join(dir, x))
		&& [...filteredFiles].some((y) => y.startsWith(path.join(dirRelative, x))));
	dirs.forEach((x) => traverseDir(
		path.join(dir, x),
		usingExports,
		{
			extensions,
			filteredFiles,
			packageDir,
			process,
			addError,
		},
	));
}

module.exports = async function listExports(packageJSON) {
	const packageDir = path.dirname(fs.realpathSync(packageJSON));

	const {
		name,
		version,
		main,
		bin,
		'private': isPrivate,
		exports,
		engines,
		type,
	} = await new Promise((resolveP, rejectP) => {
		readPackageJSON(packageJSON, (err, data) => {
			if (err) {
				rejectP(err);
			} else {
				resolveP(data);
			}
		});
	});
	if (isPrivate) {
		return {
			name,
			version,
			private: isPrivate,
		};
	}

	const extensions = Object.keys(require.extensions)
		.filter((x) => x.startsWith('.') && (type !== 'module' || x !== '.js') && x !== '.mjs');
	const legacyExtensions = type === 'module' ? extensions.concat('.js') : extensions;
	const esmExtensions = ['.mjs'].concat(type === 'module' ? '.js' : []);
	const allExtensions = extensions.concat(esmExtensions);

	const packedFiles = await packlist({ path: packageDir });
	const filteredFiles = new Set(flatMap(
		packedFiles,
		(x) => {
			const resolved = resolveFrom(path.dirname(x), packageDir, allExtensions);
			return [
				x,
				resolved && path.basename(resolved, packageDir),
			];
		},
	).filter((x) => x && allExtensions.some((ext) => x.endsWith(ext))).sort());

	let exportSpecifiersCJS = [];
	let exportSpecifiersESM = [];
	const legacyRequires = [];
	let exposedFiles = [];
	let tree = {};
	const legacyFiles = [];
	const legacyTree = {};
	const errors = [];

	const hasExports = exports != null;

	function addExportToFile(file, specifiers, usingExports = false) {
		const parts = file.split('/');
		parts.reduce((prev, part, i) => {
			/* eslint no-param-reassign: 1 */
			const key = part === '.' ? name : part;

			if (i + 1 >= parts.length) {
				prev[key] = [
					...new Set([].concat(
						prev[key] || [],
						specifiers.map((x) => (x ? x.replace(/^\.?\/?/, `${name}/`) : name)),
					)),
				].sort();
			} else if (!prev[key]) {
				prev[key] = {};
			}
			return prev[key];
		}, usingExports ? tree : legacyTree);
	}

	function processPreExportsFile(dir, {
		isMain,
		file: pkgRelativeFilename,
		usingExports,
	}) {
		let specifiers;
		const isCJS = (usingExports ? extensions : legacyExtensions)
			.some((ext) => pkgRelativeFilename.endsWith(ext));
		if (isCJS) {
			specifiers = isMain
				? [dir, `${dir.replace(/\/$/, '')}/`]
				: [
					pkgRelativeFilename,
					pkgRelativeFilename.slice(0, -path.extname(pkgRelativeFilename).length),
				];
			exportSpecifiersCJS.push(...specifiers);
			if (!usingExports) {
				legacyRequires.push(...specifiers);
				if (isMain) {
					legacyRequires.push('');
				}
			}
		} else if (esmExtensions.some((ext) => pkgRelativeFilename.endsWith(ext))) {
			specifiers = [pkgRelativeFilename];
		}
		if (specifiers) {
			if (isMain) {
				exportSpecifiersESM.push('');
			}
			exportSpecifiersESM.push(pkgRelativeFilename);
			addExportToFile(pkgRelativeFilename, specifiers, usingExports);
			if (usingExports) {
				exposedFiles.push(pkgRelativeFilename);
			} else {
				legacyFiles.push(pkgRelativeFilename);
			}
		}
	}

	function addError(err) {
		errors.push(err);
	}

	// no "exports" in package.json; standard/legacy algorithm
	// crawl the directory and discover everything that's requireable/importable
	traverseDir(packageDir, false, {
		extensions,
		filteredFiles,
		packageDir,
		process: processPreExportsFile,
		addError,
	});

	if (hasExports) {
		exportSpecifiersCJS = [];
		exportSpecifiersESM = [];
		let normalizedExports = exports ? { '.': exports } : {}; // if a string, or an object with no entrypoints
		if (typeof exports === 'object') {
			const exportKeys = Object.keys(exports);
			const starts = new Set(exportKeys.map((x) => String(x).charAt(0)));
			if (starts.has('.') && starts.size !== 1) {
				errors.push('package `exports` is invalid; either all keys, or no keys, must start with `.`');
			}
			if (exportKeys.some((x) => x.includes('node_modules'))) {
				errors.push('package `exports` is invalid; keys may not contain `node_modules`');
			}
			if (starts.has('.')) {
				normalizedExports = exports;
			}
		}
		function processExportsEntry([lhs, rhs]) {
			if (lhs.endsWith('/')) {
				// this directory is fully exposed to standard/legacy resolution
				traverseDir(path.join(packageDir, lhs), true, {
					extensions,
					filteredFiles,
					packageDir,
					process: processPreExportsFile,
					addError,
				});
			} else {
				const specifier = lhs === '.' ? '' : lhs;

				function addFile(filename, canImport, canRequire) {
					if (isDirectory(filename)) {
						errors.push(`\`${lhs}\` points to \`${rhs}\`, which is a directory!`);
					} else {
						const specifiers = [specifier.replace(/^\.\//, '')];
						if (canImport) {
							exportSpecifiersESM.push(...specifiers);
						}
						if (canRequire) {
							const isModule = esmExtensions.includes(path.extname(filename));
							if (!isModule) {
								exportSpecifiersCJS.push(...specifiers);
							}
						}
						exposedFiles.push(filename);
						addExportToFile(filename, specifiers, true);
					}
				}

				function processRHSItem(target, env = [
					'default',
					'node',
					'require',
					'import',
				]) {
					if (typeof target === 'string') {
						if (target.startsWith('./') && !target.includes('node_modules')) {
							const resolvedTarget = resolveFrom(target, packageDir, allExtensions);
							if (resolvedTarget) {
								addFile(target, true, true);
							} else {
								errors.push(`“${lhs}”: ${target} does not appear to exist!`);
							}
						} else {
							errors.push(`\`exports.${lhs}\`: ${target} must start with \`./\` and must not contain \`node_modules\``);
						}
					} else if (target && typeof target === 'object') {
						env.forEach((key) => {
							const targetValue = target[key];
							if (typeof targetValue === 'string') {
								if (targetValue.startsWith('./') && !targetValue.includes('node_modules')) {
									const resolvedTarget = resolveFrom(targetValue, packageDir, allExtensions);
									if (resolvedTarget) {
										addFile(targetValue, key !== 'require', key !== 'import');
									} else {
										errors.push(`“${specifier ? `${lhs}.` : ''}${key}”: ${targetValue} does not appear to exist!`);
									}
								} else {
									errors.push(`\`exports.${specifier ? `${lhs}.` : ''}${key}\`: ${targetValue} must start with \`./\` and must not contain \`node_modules\``);
								}
							} else if (targetValue != null) {
								processRHSItem(targetValue, [
									'default',
									'node',
								].concat(
									key === 'import' ? [] : 'require',
									key === 'require' ? [] : 'import',
								));
							}
						});
					} else {
						errors.push(`“${lhs}”: ${target} must be a string, an object, or an array of those.`);
					}
				}

				// rhs is a string, an object, or an array of both
				[].concat(rhs).forEach((x) => processRHSItem(x));
			}
		}

		entries(normalizedExports).forEach(processExportsEntry);
	} else {
		exportSpecifiersCJS = legacyRequires;
		exposedFiles = legacyFiles;
		tree = legacyTree;
	}

	function actualExportMapper(x) {
		if (x === '') {
			return name;
		}
		return `${name}/${x.replace(/^\.?\//, '')}`;
	}

	if (main) {
		const resolvedLegacyMain = resolveFrom(main.replace(/^\.?\/?/, './'), packageDir, extensions);
		if (resolvedLegacyMain) {
			const legacyMain = `./${resolvedLegacyMain.slice(packageDir.length + 1)}`;
			legacyFiles.unshift(legacyMain);
			addExportToFile(legacyMain, ['', './'], false);
			legacyRequires.push('', './');
		} else {
			errors.push(`package “main” (\`${main}\`) does not appear to exist!`);
		}
	}

	const actualRequires = [...new Set(exportSpecifiersCJS.map(actualExportMapper))].sort();
	const actualImports = [...new Set(exportSpecifiersESM.map(actualExportMapper))].sort();
	const actualLegacyRequires = [...new Set(legacyRequires.map(actualExportMapper))].sort();

	function getActualFiles(files) {
		return [
			...new Set(files
				.filter((x) => filteredFiles.has(x.replace(/^\.\//, '')))
				.map((x) => `./${x.replace(/^\.\//, '')}`)),
		].sort();
	}
	const actualFiles = getActualFiles(exposedFiles);
	const actualLegacyFiles = getActualFiles(legacyFiles);

	if (engines && engines.node) {
		// supports unflagged ESM
	}

	return {
		name,
		version,
		'engines': {
			node: '*',
			...engines,
		},
		'binaries': Object.keys(bin || {}),
		'require': actualRequires,
		'import': actualImports,
		'files': actualFiles,
		tree,
		'require (pre-exports)': actualLegacyRequires,
		'files (pre-exports)': actualLegacyFiles,
		'tree (pre-exports)': legacyTree,
		errors,
	};
};
