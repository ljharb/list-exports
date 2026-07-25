import { promisify } from 'util';
import path from 'path';

import npa from 'npm-package-arg';
import pacote from 'pacote';
import { dir, setGracefulCleanup } from 'tmp';

// cleanup is deferred to process exit: the caller reads the extracted package.json after this resolves
setGracefulCleanup();

const tmpDir = promisify(dir);

export default async function getPackageJSONPath(specifier) {
	const { name } = npa(specifier);

	const cwd = await tmpDir({ unsafeCleanup: true });

	const packageDir = path.join(cwd, 'node_modules', name);
	await pacote.extract(specifier, packageDir);

	return path.join(packageDir, 'package.json');
}
