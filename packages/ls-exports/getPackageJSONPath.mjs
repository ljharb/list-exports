import { promisify } from 'util';
import path from 'path';

import npa from 'npm-package-arg';
import pacote from 'pacote';
import { dir } from 'tmp';

const tmpDir = promisify(dir);

export default async function getPackageJSONPath(specifier) {
	const { name } = npa(specifier);

	const cwd = await tmpDir();

	const packageDir = path.join(cwd, 'node_modules', name);
	await pacote.extract(specifier, packageDir);

	return path.join(packageDir, 'package.json');
}
