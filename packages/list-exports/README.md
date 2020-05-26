# list-exports <sup>[![Version Badge][2]][1]</sup>

[![Build Status][3]][4]
[![dependency status][5]][6]
[![dev dependency status][7]][8]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][11]][1]

Given a package name and a version number, or a path to a package.json, what specifiers does it expose?

The package export defaults an `async function`. It fulfills with an object with the following keys:
  - `name` the package name
  - `version`: the package version
  - `engines`: the package's `engines` requirements
  - `binaries`: the files that are made available as executable programs
  - `errors`: any validation errors encountered during parsing. <sub>Note that these errors *do not* necessarily interfere with the listed entry points being accessible at runtime.</sub>

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

[1]: https://npmjs.org/package/list-exports
[2]: http://versionbadg.es/ljharb/list-exports.svg
[3]: https://travis-ci.com/ljharb/list-exports.svg
[4]: https://travis-ci.com/ljharb/list-exports
[5]: https://david-dm.org/ljharb/list-exports.svg
[6]: https://david-dm.org/ljharb/list-exports
[7]: https://david-dm.org/ljharb/list-exports/dev-status.svg
[8]: https://david-dm.org/ljharb/list-exports?type=dev
[11]: https://nodei.co/npm/list-exports.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/list-exports.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/list-exports.svg
[downloads-url]: https://npm-stat.com/charts.html?package=list-exports
