declare module 'glob-gitignore' {
	interface Options {
		cwd?: string;
		ignore?: string | readonly string[];
		nodir?: boolean;
		mark?: boolean;
		[key: string]: unknown;
	}

	export function sync(patterns: string | readonly string[], options?: Options): string[];
	export function glob(patterns: string | readonly string[], options?: Options): Promise<string[]>;
	export function hasMagic(patterns: string | readonly string[], options?: Options): boolean;
}
