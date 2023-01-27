# list-exports <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

Given a path to a package.json, what specifiers does it expose?

The package export defaults an `async function`. It fulfills with an object with the following keys:
  - `name` the package name
  - `version`: the package version
  - `engines`: the package's `engines` requirements
  - `binaries`: the files that are made available as executable programs
  - `errors`: any validation errors encountered during parsing. <sub>Note that these errors *do not* necessarily interfere with the listed entry points being accessible at runtime.</sub>

In addition to the required package.json path, it also takes a second argument, an options object. This object supports the following properties:
 - `level`: must be `'all'` (the default), or `'without conditions'`
   - `'all'` means "supports everything latest node supports", which includes export conditions. (note: subpath patterns are not yet supported)
   - `'without conditions'` means "support what node v13.2 - v13.6 support", which in the "exports" field only allows the string form or an object with the "default" property set

For ESM-supporting node versions (at the time of this writing, `^12.17 || >= 13.2`):
  - `require`: valid specifiers to pass into `require`
  - `import`: valid specifiers to pass into `import()`, or to use in a static `import` statement
  - `files`: all files on the filesystem that are directly exposed by the above entry points
  - `tree`: a hierarchical object structure where each directory is represented as a key containing an object, and each file is represented as a key containing a list of the entry points that expose that file

For node versions prior to ESM support (at the time of this writing, `< 12.17 || ~13.0 || ~13.1`):
  - `require (pre-exports)`: valid specifiers to pass into `require`
  - `files (pre-exports)`: all files on the filesystem that are directly exposed by the above entry points
  - `tree (pre-exports)`: a hierarchical object structure where each directory is represented as a key containing an object, and each file is represented as a key containing a list of the entry points that expose that file

## Example

`expected.json`:
```json
{
	"name": "list-exports",
	"version": "1.0.0",
	"engines": {
		"node": ">= 10"
	},
	"binaries": [],
	"require": [
		"list-exports",
		"list-exports/package.json"
	],
	"import": [
		"list-exports",
		"list-exports/package.json"
	],
	"files": [
		"./index.js",
		"./index.mjs",
		"./package.json"
	],
	"tree": {
		"list-exports": {
			"index.js": [
				"list-exports"
			],
			"index.mjs": [
				"list-exports"
			],
			"package.json": [
				"list-exports/package.json"
			]
		}
	},
	"require (pre-exports)": [
		"list-exports",
		"list-exports/",
		"list-exports/index",
		"list-exports/index.js",
		"list-exports/package",
		"list-exports/package.json"
	],
	"files (pre-exports)": [
		"./index.js",
		"./index.mjs",
		"./package.json"
	],
	"tree (pre-exports)": {
		"list-exports": {
			"index.js": [
				"list-exports",
				"list-exports/",
				"list-exports/index",
				"list-exports/index.js"
			],
			"index.mjs": [
				"list-exports/index.mjs"
			],
			"package.json": [
				"list-exports/package",
				"list-exports/package.json"
			]
		}
	},
	"errors": []
}
```

```js
const assert = require('assert');
const listExports = require('list-exports');
const expected = require('./expected.json');

listExports('list-exports@1').then((data) => {
	assert.deepEqual(data, expected);
}).catch((e) => {
	console.error(e);
	process.exit(1);
});
```

[package-url]: https://npmjs.org/package/list-exports
[npm-version-svg]: https://versionbadg.es/ljharb/list-exports.svg
[deps-svg]: https://david-dm.org/ljharb/list-exports.svg
[deps-url]: https://david-dm.org/ljharb/list-exports
[dev-deps-svg]: https://david-dm.org/ljharb/list-exports/dev-status.svg
[dev-deps-url]: https://david-dm.org/ljharb/list-exports#info=devDependencies
[npm-badge-png]: https://nodei.co/npm/list-exports.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/list-exports.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/list-exports.svg
[downloads-url]: https://npm-stat.com/charts.html?package=list-exports
[codecov-image]: https://codecov.io/gh/ljharb/list-exports/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/list-exports/
[actions-image]: https://img.shields.io/endpoint?url=https://github-actions-badge-u3jn4tfpocch.runkit.sh/ljharb/list-exports
[actions-url]: https://github.com/ljharb/list-exports/actions
[category]: https://github.com/inspect-js/node-exports-info#categories
