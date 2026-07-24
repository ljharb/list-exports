// Minimal stubs for the es-shim packages this repo consumes: each mirrors the
// signature of the native method it shims, with the receiver as the first
// argument. Only the call signatures are declared - the `shim`/`getPolyfill`/
// `implementation` properties are unused here.

declare module 'array.prototype.filter' {
	function filter<T, S extends T>(
		array: ArrayLike<T>,
		predicate: (value: T, index: number, array: T[]) => value is S,
		thisArg?: unknown,
	): S[];
	function filter<T>(
		array: ArrayLike<T>,
		predicate: (value: T, index: number, array: T[]) => unknown,
		thisArg?: unknown,
	): T[];

	export = filter;
}

declare module 'array.prototype.some' {
	function some<T>(
		array: ArrayLike<T>,
		predicate: (value: T, index: number, array: T[]) => unknown,
		thisArg?: unknown,
	): boolean;

	export = some;
}

declare module 'array.prototype.map' {
	function map<T, U>(
		array: ArrayLike<T>,
		callbackfn: (value: T, index: number, array: T[]) => U,
		thisArg?: unknown,
	): U[];

	export = map;
}

declare module 'array.prototype.reduce' {
	function reduce<T>(
		array: ArrayLike<T>,
		callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
	): T;
	function reduce<T, U>(
		array: ArrayLike<T>,
		callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
		initialValue: U,
	): U;

	export = reduce;
}

declare module 'array.prototype.flat' {
	function flat<T>(array: ArrayLike<T>, depth?: number): unknown[];

	export = flat;
}

declare module 'array.prototype.flatmap' {
	function flatMap<T, U>(
		array: ArrayLike<T>,
		callbackfn: (value: T, index: number, array: T[]) => U | readonly U[],
		thisArg?: unknown,
	): U[];

	export = flatMap;
}

declare module 'array-includes' {
	function includes<T>(array: ArrayLike<T>, searchElement: unknown, fromIndex?: number): boolean;

	export = includes;
}

declare module 'array.from' {
	function arrayFrom<T>(items: Iterable<T> | ArrayLike<T>): T[];
	function arrayFrom<T, U>(
		items: Iterable<T> | ArrayLike<T>,
		mapfn: (value: T, index: number) => U,
		thisArg?: unknown,
	): U[];

	export = arrayFrom;
}

declare module 'object.entries' {
	function entries<T>(object: { [s: string]: T } | ArrayLike<T>): [string, T][];
	function entries(object: object): [string, unknown][];

	export = entries;
}

declare module 'object.fromentries' {
	function fromEntries<T>(entries: Iterable<readonly [PropertyKey, T]>): { [k: string]: T };

	export = fromEntries;
}

declare module 'object-keys' {
	function keys(object: object): string[];

	export = keys;
}

declare module 'string.prototype.startswith' {
	function startsWith(string: string, searchString: string, position?: number): boolean;

	export = startsWith;
}

declare module 'string.prototype.endswith' {
	function endsWith(string: string, searchString: string, endPosition?: number): boolean;

	export = endsWith;
}
