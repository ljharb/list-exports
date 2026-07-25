'use strict';

const test = require('tape');

const { SKIP_CLI } = process.env;

// `ls-exports` requires node 22+ (`util.styleText`); the node-18 test matrix sets SKIP_CLI
test('compareTreeRows', { skip: !!SKIP_CLI }, async (t) => {
	const { compareTreeRows } = await import('../../ls-exports/exportsTable.mjs');

	t.deepEqual(
		['zebra.js', 'apple.js', 'mango.js', 'banana.js', 'z/', 'a/', 'm/'].sort(compareTreeRows),
		['a/', 'm/', 'z/', 'apple.js', 'banana.js', 'mango.js', 'zebra.js'],
		'directories sort first (alphabetized), then files (alphabetized)',
	);

	t.ok(compareTreeRows('apple.js', 'banana.js') < 0, 'a file sorts before a later file');
	t.ok(compareTreeRows('banana.js', 'apple.js') > 0, 'a file sorts after an earlier file');
	t.equal(compareTreeRows('apple.js', 'apple.js'), 0, 'equal files compare equal');

	t.ok(compareTreeRows('a/', 'b/') < 0, 'a directory sorts before a later directory');
	t.ok(compareTreeRows('z/', 'apple.js') < 0, 'a directory sorts before any file');
	t.ok(compareTreeRows('apple.js', 'z/') > 0, 'a file sorts after any directory');

	const items = ['sync.js', 'async.js', 'lib/', 'index.js', 'bin/'];
	items.forEach((a) => {
		t.equal(compareTreeRows(a, a), 0, `cmp(${a}, ${a}) === 0`);
		items.forEach((b) => {
			if (a !== b) {
				t.equal(
					Math.sign(compareTreeRows(a, b)),
					-Math.sign(compareTreeRows(b, a)),
					`sign(cmp(${a}, ${b})) === -sign(cmp(${b}, ${a}))`,
				);
			}
		});
	});

	t.end();
});
