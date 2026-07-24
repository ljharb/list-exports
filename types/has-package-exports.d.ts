// `has-package-exports` ships no types; each entry point is a boolean constant
// describing what the current node version supports in the `exports` field.

declare module 'has-package-exports' {
	const hasPackageExports: boolean;
	export = hasPackageExports;
}

declare module 'has-package-exports/conditional' {
	const hasConditionalExports: boolean;
	export = hasConditionalExports;
}

declare module 'has-package-exports/pattern' {
	const hasPatternExports: boolean;
	export = hasPatternExports;
}

declare module 'has-package-exports/pattern-trailers' {
	const hasPatternTrailers: boolean;
	export = hasPatternTrailers;
}
