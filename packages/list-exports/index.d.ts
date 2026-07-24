declare namespace listExports {
	/** One of the “categories” of `exports` support that node has shipped over time. */
	type Category = ReturnType<typeof import('node-exports-info/getCategoriesForRange')>[number];

	type Options = {
		/**
		 * `true` reads the `engines.node` field in the `package.json`; a string is a valid
		 * semver range of node versions to target. Defaults to the current node version.
		 */
		node?: true | string;
		/**
		 * Additional export conditions to recognize, similar to node’s `--conditions` flag.
		 * `true` auto-detects them from `--conditions`/`-C` in `process.execArgv` or `NODE_OPTIONS`.
		 */
		conditions?: true | string | readonly string[];
	};

	/**
	 * Keys are filenames (no leading `./`), whose values are a Set of the `import`/`require`
	 * specifiers that point to them; or directory names, whose values are a Map of the same
	 * recursive structure as `Tree` itself.
	 */
	type Tree = Map<string, Set<string> | Tree>;

	type CategoryExports = {
		/** import specifier, to relative file path */
		import: Map<string, string>;
		/** require specifier, to relative file path */
		require: Map<string, string>;
		/** relative file paths that are included in `import` and/or `require` */
		files: Set<string>;
		tree: Tree;
	};

	type Exports = {
		/** executable program name, to the relative file path that name will execute */
		binaries: Record<string, string>;
		/** the latest `Category` in the given node version range; always present as a key below */
		latest: Category;
		/** always present, whether or not it is in the given node version range */
		'pre-exports': CategoryExports;
	} & Partial<Record<Category, CategoryExports>>;

	type Engines = {
		node: string;
		[engine: string]: string | undefined;
	};

	type PrivateResults = {
		name: string;
		version: string;
		private: true;
		problems: Set<string>;
	};

	type Results = {
		name: string;
		version: string;
		private?: undefined;
		engines: Engines;
		/**
		 * Problems or validation issues encountered during exports traversal. Note that these
		 * do *not* necessarily interfere with the listed entry points being accessible at runtime.
		 */
		problems: Set<string>;
		exports: Exports;
	};
}

declare function listExports(
	packageJSON: string,
	options?: listExports.Options,
): Promise<listExports.PrivateResults | listExports.Results>;

export = listExports;
