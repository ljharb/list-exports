import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function tryResolve(spec) {
  try { return [spec, require.resolve(spec)]; }
  catch (e) { return [spec, `ERR: ${e.code || e.message}`]; }
}

const specs = [
  '@fixtures/ex-stars-basic/hooks/useA',
  '@fixtures/ex-stars-basic/multi/a/x/z',
  '@fixtures/ex-stars-basic/mismatch/a/z',
  '@fixtures/ex-stars-basic/rhs-extra/a/b',
  '@fixtures/ex-stars-basic/literal/**'
];

for (const s of specs) {
  const [spec, out] = tryResolve(s);
  console.log(spec, '=>', out);
}
