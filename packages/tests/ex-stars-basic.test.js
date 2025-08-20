'use strict';

// extra tests to confirm Node’s behavior:
// - multi star and mismatch should not be exported
// - rhs-extra should map but fail with MODULE_NOT_FOUND
// - literal/** is treated as literal and not exported

const test = require('tape');
const path = require('path');
const listExports = require(path.resolve(__dirname, '../list-exports'));

test('ex-stars-basic mirrors Node first-star behavior', async (t) => {
	const pkg = path.join(__dirname, 'fixtures/ex-stars-basic/project/package.json');

	const res = await listExports(pkg, { node: true });
	t.ok(res && res.exports && res.exports.conditions, 'has conditions tree');

	const tree = res.exports.conditions;

	const get = (k) => tree.import.get(k) || tree.require.get(k);

	t.equal(get('./hooks/useA'), './src/hooks/useA.js', 'hooks/useA maps to file');

	t.equal(get('./multi/a/x/z'), undefined, 'multi/a/x/z NOT exported');
	t.equal(get('./mismatch/a/z'), undefined, 'mismatch/a/z NOT exported');
	t.equal(get('./rhs-extra/a/b'), undefined, 'rhs-extra/a/b NOT exported');
	t.equal(get('./literal/**'), './src/literal/**.js', 'literal/** maps to literal star file');

	// explicitly absent from both maps
	t.notOk(tree.import.has('./multi/a/x/z') || tree.require.has('./multi/a/x/z'), 'multi key absent in both import/require');
	t.notOk(tree.import.has('./mismatch/a/z') || tree.require.has('./mismatch/a/z'), 'mismatch key absent in both import/require');
	t.notOk(tree.import.has('./rhs-extra/a/b') || tree.require.has('./rhs-extra/a/b'), 'rhs-extra key absent in both import/require');
	t.ok(tree.import.has('./literal/**') || tree.require.has('./literal/**'), 'literal/** key present in import/require');

	// problems should include messages for missing/invalid targets
	const problemsArr = Array.from(res.problems || []);
	t.ok(problemsArr.some((p) => (/multi\/a\/x\/z/i).test(p) || (/does not appear to exist/i).test(p)), 'problem surfaced for multi');
	t.ok(problemsArr.some((p) => (/mismatch\/a\/z/i).test(p) || (/does not appear to exist/i).test(p)), 'problem surfaced for mismatch');
	t.ok(problemsArr.some((p) => (/rhs-extra\/a\/b/i).test(p) || (/does not appear to exist/i).test(p)), 'problem surfaced for rhs-extra');
});
