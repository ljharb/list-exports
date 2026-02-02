'use strict';

const test = require('tape');
const path = require('path');
const arrayFrom = require('array.from');

const listExports = require('list-exports');

const fixturesDir = path.join(__dirname, 'fixtures');
function fixturePkgJSON(name) {
	return path.join(fixturesDir, name, 'project', 'package.json');
}

test('conditions option: validation', function (t) {
	t.test('rejects non-true, non-string, non-array values', async function (st) {
		try {
			await listExports(fixturePkgJSON('has-package-exports'), { conditions: 123 });
			st.fail('should have thrown for number');
		} catch (e) {
			st.ok(e instanceof TypeError, 'throws TypeError for number');
			st.match(e.message, /`conditions` option must be `true`, a string, or an array of strings/);
		}

		try {
			await listExports(fixturePkgJSON('has-package-exports'), { conditions: {} });
			st.fail('should have thrown for object');
		} catch (e) {
			st.ok(e instanceof TypeError, 'throws TypeError for object');
		}

		try {
			await listExports(fixturePkgJSON('has-package-exports'), { conditions: null });
			st.fail('should have thrown for null');
		} catch (e) {
			st.ok(e instanceof TypeError, 'throws TypeError for null');
		}
	});

	t.test('rejects arrays with non-string or empty-string elements', async function (st) {
		try {
			await listExports(fixturePkgJSON('has-package-exports'), { conditions: [123] });
			st.fail('should have thrown for array with number');
		} catch (e) {
			st.ok(e instanceof TypeError, 'throws TypeError for array with number');
			st.match(e.message, /`conditions` option must contain only non-empty strings/);
		}

		try {
			await listExports(fixturePkgJSON('has-package-exports'), { conditions: [''] });
			st.fail('should have thrown for array with empty string');
		} catch (e) {
			st.ok(e instanceof TypeError, 'throws TypeError for array with empty string');
		}
	});

	t.test('accepts valid values', async function (st) {
		st.doesNotThrow(function () {
			return listExports(fixturePkgJSON('has-package-exports'), { conditions: 'browser' });
		}, 'accepts a string');

		st.doesNotThrow(function () {
			return listExports(fixturePkgJSON('has-package-exports'), { conditions: ['browser'] });
		}, 'accepts an array of strings');

		st.doesNotThrow(function () {
			return listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
		}, 'accepts true');
	});

	t.end();
});

test('conditions option: execArgv parsing', function (t) {
	t.test('parses --conditions=value from execArgv', async function (st) {
		var savedExecArgv = process.execArgv;
		process.execArgv = ['--conditions=browser'];
		try {
			var results = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
			var allExportKeys = [];
			Object.keys(results.exports).forEach(function (category) {
				var catExports = results.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						allExportKeys.push(key);
					});
				}
			});
			st.ok(allExportKeys.length > 0, 'has exports when browser condition is set via --conditions=browser');
		} finally {
			process.execArgv = savedExecArgv;
		}
	});

	t.test('parses -C=value from execArgv', async function (st) {
		var savedExecArgv = process.execArgv;
		process.execArgv = ['-C=browser'];
		try {
			var results = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
			var allExportKeys = [];
			Object.keys(results.exports).forEach(function (category) {
				var catExports = results.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						allExportKeys.push(key);
					});
				}
			});
			st.ok(allExportKeys.length > 0, 'has exports when browser condition is set via -C=browser');
		} finally {
			process.execArgv = savedExecArgv;
		}
	});

	t.test('parses --conditions value (space-separated) from execArgv', async function (st) {
		var savedExecArgv = process.execArgv;
		process.execArgv = ['--conditions', 'browser'];
		try {
			var results = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
			var allExportKeys = [];
			Object.keys(results.exports).forEach(function (category) {
				var catExports = results.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						allExportKeys.push(key);
					});
				}
			});
			st.ok(allExportKeys.length > 0, 'has exports when browser condition is set via --conditions browser');
		} finally {
			process.execArgv = savedExecArgv;
		}
	});

	t.end();
});

test('conditions option: NODE_OPTIONS parsing', function (t) {
	t.test('parses --conditions=value from NODE_OPTIONS', async function (st) {
		var savedNodeOptions = process.env.NODE_OPTIONS;
		var savedExecArgv = process.execArgv;
		process.execArgv = [];
		process.env.NODE_OPTIONS = '--conditions=browser';
		try {
			var results = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
			var allExportKeys = [];
			Object.keys(results.exports).forEach(function (category) {
				var catExports = results.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						allExportKeys.push(key);
					});
				}
			});
			st.ok(allExportKeys.length > 0, 'has exports when browser condition is set via NODE_OPTIONS --conditions=browser');
		} finally {
			process.execArgv = savedExecArgv;
			if (typeof savedNodeOptions === 'undefined') {
				delete process.env.NODE_OPTIONS;
			} else {
				process.env.NODE_OPTIONS = savedNodeOptions;
			}
		}
	});

	t.test('parses -C=value from NODE_OPTIONS', async function (st) {
		var savedNodeOptions = process.env.NODE_OPTIONS;
		var savedExecArgv = process.execArgv;
		process.execArgv = [];
		process.env.NODE_OPTIONS = '-C=browser';
		try {
			var results = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
			var allExportKeys = [];
			Object.keys(results.exports).forEach(function (category) {
				var catExports = results.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						allExportKeys.push(key);
					});
				}
			});
			st.ok(allExportKeys.length > 0, 'has exports when browser condition is set via NODE_OPTIONS -C=browser');
		} finally {
			process.execArgv = savedExecArgv;
			if (typeof savedNodeOptions === 'undefined') {
				delete process.env.NODE_OPTIONS;
			} else {
				process.env.NODE_OPTIONS = savedNodeOptions;
			}
		}
	});

	t.test('parses --conditions value (space-separated) from NODE_OPTIONS', async function (st) {
		var savedNodeOptions = process.env.NODE_OPTIONS;
		var savedExecArgv = process.execArgv;
		process.execArgv = [];
		process.env.NODE_OPTIONS = '--conditions browser';
		try {
			var results = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
			var allExportKeys = [];
			Object.keys(results.exports).forEach(function (category) {
				var catExports = results.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						allExportKeys.push(key);
					});
				}
			});
			st.ok(allExportKeys.length > 0, 'has exports when browser condition is set via NODE_OPTIONS --conditions browser');
		} finally {
			process.execArgv = savedExecArgv;
			if (typeof savedNodeOptions === 'undefined') {
				delete process.env.NODE_OPTIONS;
			} else {
				process.env.NODE_OPTIONS = savedNodeOptions;
			}
		}
	});

	t.test('parses -C value (space-separated) from NODE_OPTIONS', async function (st) {
		var savedNodeOptions = process.env.NODE_OPTIONS;
		var savedExecArgv = process.execArgv;
		process.execArgv = [];
		process.env.NODE_OPTIONS = '-C browser';
		try {
			var results = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
			var allExportKeys = [];
			Object.keys(results.exports).forEach(function (category) {
				var catExports = results.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						allExportKeys.push(key);
					});
				}
			});
			st.ok(allExportKeys.length > 0, 'has exports when browser condition is set via NODE_OPTIONS -C browser');
		} finally {
			process.execArgv = savedExecArgv;
			if (typeof savedNodeOptions === 'undefined') {
				delete process.env.NODE_OPTIONS;
			} else {
				process.env.NODE_OPTIONS = savedNodeOptions;
			}
		}
	});

	t.test('deduplicates conditions from execArgv and NODE_OPTIONS', async function (st) {
		var savedNodeOptions = process.env.NODE_OPTIONS;
		var savedExecArgv = process.execArgv;
		process.execArgv = ['--conditions=browser'];
		process.env.NODE_OPTIONS = '--conditions=browser';
		try {
			var resultsDuped = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });

			process.execArgv = ['--conditions=browser'];
			process.env.NODE_OPTIONS = '';
			var resultsSingle = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });

			var dupedJSON = JSON.stringify(resultsDuped, function (key, value) {
				if (value instanceof Set) { return arrayFrom(value); }
				if (value instanceof Map) { return Object.fromEntries(arrayFrom(value)); }
				return value;
			});
			var singleJSON = JSON.stringify(resultsSingle, function (key, value) {
				if (value instanceof Set) { return arrayFrom(value); }
				if (value instanceof Map) { return Object.fromEntries(arrayFrom(value)); }
				return value;
			});

			st.equal(dupedJSON, singleJSON, 'duplicate conditions from execArgv + NODE_OPTIONS produce same result as single');
		} finally {
			process.execArgv = savedExecArgv;
			if (typeof savedNodeOptions === 'undefined') {
				delete process.env.NODE_OPTIONS;
			} else {
				process.env.NODE_OPTIONS = savedNodeOptions;
			}
		}
	});

	t.test('does not parse -Cvalue (no separator) from NODE_OPTIONS', async function (st) {
		var savedNodeOptions = process.env.NODE_OPTIONS;
		var savedExecArgv = process.execArgv;
		process.execArgv = [];
		process.env.NODE_OPTIONS = '-Cbrowser';
		try {
			var results = await listExports(fixturePkgJSON('has-package-exports'), { conditions: true });
			var allExportKeys = [];
			Object.keys(results.exports).forEach(function (category) {
				var catExports = results.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						allExportKeys.push(key);
					});
				}
			});

			var withoutConditions = await listExports(fixturePkgJSON('has-package-exports'));
			var baseExportKeys = [];
			Object.keys(withoutConditions.exports).forEach(function (category) {
				var catExports = withoutConditions.exports[category];
				if (catExports && catExports.require) {
					arrayFrom(catExports.require.keys()).forEach(function (key) {
						baseExportKeys.push(key);
					});
				}
			});

			st.deepEqual(allExportKeys, baseExportKeys, '-Cbrowser (no separator) is not parsed as a condition');
		} finally {
			process.execArgv = savedExecArgv;
			if (typeof savedNodeOptions === 'undefined') {
				delete process.env.NODE_OPTIONS;
			} else {
				process.env.NODE_OPTIONS = savedNodeOptions;
			}
		}
	});

	t.end();
});

test('conditions option: deduplication', function (t) {
	t.test('duplicate explicit conditions produce same result as single', async function (st) {
		var resultsDuped = await listExports(fixturePkgJSON('has-package-exports'), { conditions: ['browser', 'browser'] });
		var resultsSingle = await listExports(fixturePkgJSON('has-package-exports'), { conditions: ['browser'] });

		var dupedJSON = JSON.stringify(resultsDuped, function (key, value) {
			if (value instanceof Set) { return arrayFrom(value); }
			if (value instanceof Map) { return Object.fromEntries(arrayFrom(value)); }
			return value;
		});
		var singleJSON = JSON.stringify(resultsSingle, function (key, value) {
			if (value instanceof Set) { return arrayFrom(value); }
			if (value instanceof Map) { return Object.fromEntries(arrayFrom(value)); }
			return value;
		});

		st.equal(dupedJSON, singleJSON, 'conditions: ["browser", "browser"] produces same result as ["browser"]');
	});

	t.end();
});

test('conditions option: private packages', function (t) {
	t.test('valid conditions do not cause errors for private packages', async function (st) {
		var results = await listExports(fixturePkgJSON('ex-private'), { conditions: ['browser'] });

		st.ok(results.private, 'result indicates package is private');
		st.notOk(results.exports, 'private packages have no exports in result');
	});

	t.test('conditions: true does not cause errors for private packages', async function (st) {
		var results = await listExports(fixturePkgJSON('ex-private'), { conditions: true });

		st.ok(results.private, 'result indicates package is private');
		st.notOk(results.exports, 'private packages have no exports in result');
	});

	t.test('invalid conditions still throw for private packages', async function (st) {
		try {
			await listExports(fixturePkgJSON('ex-private'), { conditions: 123 });
			st.fail('should have thrown');
		} catch (e) {
			st.ok(e instanceof TypeError, 'throws TypeError for invalid conditions even on private packages');
		}
	});

	t.end();
});
