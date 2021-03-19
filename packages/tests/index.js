'use strict';

const test = require('tape');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { diffString } = require('json-diff');

const listExports = require('list-exports');

const { OFFLINE, GREP, WRITE, SKIP_CLI } = process.env;

const fixturesDir = path.join(__dirname, 'fixtures');
const fixtures = fs.readdirSync(fixturesDir);

const isOffline = !!OFFLINE;

const cli = path.join(__dirname, '..', 'ls-exports', 'bin', 'ls-exports');

const re = GREP && new RegExp(GREP);

function readExpectedJson(expectedPath, packageData) {
	const expected = JSON.parse(fs.readFileSync(expectedPath));
	if (expected.name === 'ls-exports' || expected.name === 'list-exports') {
		expected.version = packageData.version;
	}
	return expected;
}

function diffApiOutput(t, message, { expected, results, expectedPath }) {
	const diff = diffString(expected, results);
	if (diff) {
		console.error('# ' + diff.split('\n').join('\n# '));
	}
	t.deepEqual(results, expected, message);
	if (WRITE) {
		let resultsToWrite = results;
		if (expected.name === 'ls-exports' || expected.name === 'list-exports') {
			resultsToWrite = { ...resultsToWrite, version: null };
		}
		fs.writeFileSync(expectedPath, JSON.stringify(resultsToWrite, null, '\t').trim() + '\n');
	}
}

test('listExports', (t) => {
	t.plan(fixtures.length);

	fixtures.forEach((fixture) => {
		const skip = re && !re.test(fixture);
		t.test(`fixture: ${fixture}`, { skip: skip }, async (st) => {
			const checkNPM = !isOffline && !fixture.startsWith('ex-') && fixture !== 'list-exports' && fixture !== 'ls-exports';

			st.plan(3);

			const fixtureDir = path.join(fixturesDir, fixture);
			const projectDir = path.join(fixtureDir, 'project');

			const expectedPath = path.join(fixtureDir, 'expected.json');
			const packageJSON = path.resolve(path.join(projectDir, 'package.json'));
			const packageData = JSON.parse(fs.readFileSync(packageJSON));
			const expected = readExpectedJson(expectedPath, packageData);

			const results = await listExports(packageJSON)['catch']((e) => {
				console.error(e);
				throw e;
			});

			diffApiOutput(st, `${fixture}: API results match expectation`, {
				expected: expected,
				results: results,
				expectedPath: expectedPath
			});

			st.test(`fixture: ${fixture}: without conditions`, async (s2t) => {
				s2t.plan(1);

				const expectedWithoutConditionsPath = path.join(fixtureDir, 'expected-without-conditions.json');
				const expectedWithoutConditions = readExpectedJson(expectedWithoutConditionsPath, packageData);

				const resultsWithoutConditions = await listExports(packageJSON, { level: 'without conditions' })['catch']((e) => {
					console.error(e);
					throw e;
				});

				diffApiOutput(s2t, `${fixture}: API results match expectation without conditions`, {
					expected: expectedWithoutConditions,
					results: resultsWithoutConditions,
					expectedPath: expectedWithoutConditionsPath
				});
			});

			st.test(`fixture: ${fixture}: CLI`, { skip: SKIP_CLI }, (s2t) => {
				s2t.plan(checkNPM ? 2 : 1);

				const cliResults = JSON.parse(execSync(`${cli} path "./${path.relative(process.cwd(), projectDir)}" --json`));
				s2t.deepEqual(cliResults, expected, `${fixture}: CLI results match expectation`);

				if (checkNPM) {
					const npmResults = JSON.parse(execSync(`${cli} package "${results.name}@${results.version}" --json`));
					const npmDiff = diffString(expected, npmResults);
					if (npmDiff) {
						console.error('# ' + npmDiff.split('\n').join('\n# '));
					}
					s2t.deepEqual(npmResults, expected, `${fixture}: npm package results match expectation`);
				}
			});
		});
	});

	t.end();
});
