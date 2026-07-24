// Minimal stubs for the npm-ecosystem packages this repo consumes. Only the
// members actually used are declared; each package ships no types of its own,
// and the published `@types/*` entries are pinned to far older majors.

declare module '@npmcli/arborist' {
	namespace Arborist {
		interface PackageJson {
			name?: string;
			version?: string;
			engines?: { [engine: string]: string | null | undefined };
			[key: string]: unknown;
		}

		interface Node {
			name: string;
			package: PackageJson;
			root: Node | null;
			children: Map<string, Node>;
			[key: string]: unknown;
		}
	}

	class Arborist {
		constructor(options?: { path?: string; [key: string]: unknown });
		loadActual(): Promise<Arborist.Node>;
		loadVirtual(): Promise<Arborist.Node>;
	}

	export = Arborist;
}

declare module 'npm-packlist' {
	import type Arborist from '@npmcli/arborist';

	function packlist(
		tree: Awaited<ReturnType<InstanceType<typeof Arborist>['loadActual']>>,
		options?: { path?: string; [key: string]: unknown },
	): Promise<string[]>;

	export = packlist;
}

declare module 'read-package-json' {
	namespace readJson {
		type PackageData = {
			name: string;
			version: string;
			private?: boolean;
			type?: string;
			main?: unknown;
			bin?: string | Record<string, string>;
			exports?: unknown;
			engines?: { [engine: string]: string | undefined };
			[key: string]: unknown;
		};
	}

	function readJson(
		file: string,
		cb: (err: Error | null, data: readJson.PackageData) => void,
	): void;

	export = readJson;
}

declare module 'npm-package-arg' {
	namespace npa {
		type Result = {
			name: string | null;
			type: string;
			raw: string;
			rawSpec: string;
			fetchSpec: string | null;
			escapedName: string | null;
			scope: string | null;
			[key: string]: unknown;
		};
	}

	function npa(arg: string, where?: string): npa.Result;

	export = npa;
}

declare module 'pacote' {
	export function extract(
		spec: string,
		dest: string,
		options?: Record<string, unknown>,
	): Promise<{ resolved: string; integrity: string; from: string }>;
	export function manifest(spec: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
}

declare module 'sort-paths' {
	function sortPaths<T>(items: readonly T[], dirSeparator: string): T[];
	function sortPaths<T>(items: readonly T[], iteratee: (item: T) => string, dirSeparator: string): T[];

	export = sortPaths;
}
