import ljharb from '@ljharb/eslint-config/flat/node/22';

export default [
	...ljharb,
	{
		rules: {
			'func-style': 'off',
			'function-call-argument-newline': ['off', 'consistent'],
			'max-lines-per-function': 'off',
			'no-extra-parens': 'off', // conflicts with JSDoc type casts
			'sort-keys': 'off',
		},
	},
];
