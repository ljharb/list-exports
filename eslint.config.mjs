import ljharb from '@ljharb/eslint-config/flat/node/18';
import ljharbES5 from '@ljharb/eslint-config/flat/node/0.4';

export default [
	{
		ignores: [
			'**/node_modules/**',
			'packages/tests/fixtures/**',
			'packages/tests/conditions*.js',
		],
	},
	...ljharb,
	...ljharbES5.map((config) => ({
		...config,
		files: ['packages/tests/conditions*.js'],
	})),
	{
		files: ['since.js'],
		rules: {
			'no-console': 'off',
		},
	},
	{
		files: ['packages/list-exports/**/*.js'],
		rules: {
			complexity: 'off',
			eqeqeq: ['error', 'allow-null'],
			'func-style': 'off',
			'id-length': 'off',
			'max-lines': 'off',
			'max-lines-per-function': 'off',
			'max-params': 'warn',
			'max-statements': 'warn',
			'multiline-comment-style': 'off',
			'new-cap': [
				'error', {
					capIsNewExceptions: ['GetIntrinsic'],
				},
			],
			'sort-keys': 'off',
		},
	},
	{
		files: ['packages/ls-exports/**/*.js', 'packages/ls-exports/**/*.mjs'],
		rules: {
			'func-style': 'off',
			'function-call-argument-newline': ['off', 'consistent'],
			'max-lines-per-function': 'off',
			'sort-keys': 'off',
		},
	},
	{
		files: ['packages/tests/**/*.js'],
		rules: {
			'array-bracket-newline': 'off',
			complexity: 'off',
			'func-style': 'off',
			'id-length': 'off',
			'max-len': 'off',
			'max-lines-per-function': 'off',
			'max-nested-callbacks': 'off',
			'multiline-comment-style': 'off',
			'no-negated-condition': 'off',
			'object-curly-newline': 'off',
			'sort-keys': 'off',
		},
	},
	{
		files: ['packages/tests/add-fixture.mjs'],
		languageOptions: {
			ecmaVersion: 2023,
		},
		rules: {
			'sort-keys': 'off',
		},
	},
];
