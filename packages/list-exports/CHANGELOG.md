# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [list-exports@2.1.0](https://github.com/ljharb/list-exports/compare/list-exports@2.0.0...list-exports@2.1.0) - 2026-01-19

### Commits

- [list-exports] [deps] update `@npmcli/arborist`, `array-includes`, `array.prototype.flat`, `array.prototype.flatmap`, `array.prototype.map`, `array.prototype.reduce`, `call-bound`, `for-each`, `get-intrinsic`, `npm-packlist`, `object-inspect`, `object.entries`, `safe-array-concat`, `semver`, `validate-exports-object` [`854e12a`](https://github.com/ljharb/list-exports/commit/854e12aec7edc4516273a0711e2673f203d919c3)
- [*] [dev deps] update `eslint` [`976d6a5`](https://github.com/ljharb/list-exports/commit/976d6a5b83c484d86bd7d2116372980048c6c925)
- [list-exports] [New] support requiring `.mjs` in require-esm+ categories [`92566dc`](https://github.com/ljharb/list-exports/commit/92566dcff4df080ea32060885f970d635d8c548a)
- [*] [dev deps] update `eslint`, `@ljharb/eslint-config`, `ls-engines` [`893faf3`](https://github.com/ljharb/list-exports/commit/893faf3f1f7d59912a602bfefa72496a44de6509)
- [list-exports] v2.1.0 [`4c46bd1`](https://github.com/ljharb/list-exports/commit/4c46bd173e05ed868a20cd98db65a8d0b162d362)
- [*] [deps] update `node-exports-info` to v1.5.0 [`d75aa87`](https://github.com/ljharb/list-exports/commit/d75aa87b630cba031f91f6ce8e44cbf396b0ee28)
- [list-exports] [fix] exclude `.node` files from import map [`cf4225f`](https://github.com/ljharb/list-exports/commit/cf4225f2171a40b59d5893d5c95742573ffee43e)

## [list-exports@2.0.0](https://github.com/ljharb/list-exports/compare/list-exports@1.1.0...list-exports@2.0.0) - 2026-01-14

### Commits

- [{ls,list}-exports] [breaking] complete overhaul [`3ed06cd`](https://github.com/ljharb/list-exports/commit/3ed06cdabd8d119f8f1d8bb9f68356dc96267813)
- [ls-exports] [breaking] update `npm-package-arg`, `pacote`, `yargs`; drop node &lt; 14 [`0f7478b`](https://github.com/ljharb/list-exports/commit/0f7478bfecf94d7a79885e97bd35ae9f3f653530)
- [New] include TS extensions when nodeRange supports native TypeScript [`324ec2f`](https://github.com/ljharb/list-exports/commit/324ec2f18595069a3357efbd4af6c8fab2ec3dd7)
- [list-exports] [deps] update `@npmcli/arborist`, `array-includes`, `array.from`, `array.prototype.filter`, `array.prototype.flat`, `array.prototype.flatmap`, `array.prototype.map`, `array.prototype.reduce`, `array.prototype.some`, `call-bind`, `get-intrinsic`, `hasown`, `node-exports-info`, `npm-packlist`, `object.fromentries`, `semver`, `string.prototype.endswith`, `validate-exports-object` [`eaaad4a`](https://github.com/ljharb/list-exports/commit/eaaad4a207c16055a52a0b13d317797f686e82ec)
- [list-exports] [deps] update `@npmcli/arborist`, `array-includes`, `array.from`, `array.prototype.filter`, `array.prototype.map`, `array.prototype.reduce`, `array.prototype.some`, `hasown`, `node-exports-info`, `object-inspect`, `object.entries`, `object.fromentries`, `read-package-json`, `semver`, `string.prototype.endswith`, `validate-exports-object` [`7cfffe3`](https://github.com/ljharb/list-exports/commit/7cfffe36f55e01574f7ccf999991463b4c9c4bff)
- [ls-exports, list-exports] [readme] update badges [`f814499`](https://github.com/ljharb/list-exports/commit/f814499ad9cda6c3d830b72f645016d2110d55a0)
- [Tests] add fixture with remapped folder [`2af2b4b`](https://github.com/ljharb/list-exports/commit/2af2b4b8a82ee0035ebb0dce6f01e5a2e0f3d7fd)
- [Fix] only list implicit paths when package has no exports field [`5117340`](https://github.com/ljharb/list-exports/commit/511734053622abc7ea937e0a507869d8836804ce)
- [list-exports] [robustness] use `for-each` [`19c8ffd`](https://github.com/ljharb/list-exports/commit/19c8ffdec565a5685829e62fe102b02672e8f4f8)
- [list-exports] [refactor] remove redundant async helper [`cf6e829`](https://github.com/ljharb/list-exports/commit/cf6e829cb8abf5f60cdbfb26a1df23c2401a904f)
- [Fix] properly sort tree output [`81a519b`](https://github.com/ljharb/list-exports/commit/81a519b9c46432e176cd2f83b1ebdc76ef5e22c0)
- [Fix] `node_modules` is apparently allowed in `exports` objects [`32afd30`](https://github.com/ljharb/list-exports/commit/32afd30be12ac67ab6cded26f57a6de9dd7fd1e9)
- [Refactor] use `safeSet` [`a126a0a`](https://github.com/ljharb/list-exports/commit/a126a0a4dfa619b386a5c323ca907a8c6d9ab4a4)
- [list-exports] [deps] update `call-bind`, `get-intrinsic`, `object-inspect`, `safe-array-concat`, `string.prototype.startswith` [`d194021`](https://github.com/ljharb/list-exports/commit/d1940211c50805bef6edde4d6a2d32fb936f8bd0)
- [list-exports] [breaking] remove useless `index.mjs` [`5838515`](https://github.com/ljharb/list-exports/commit/58385150c2d38b5995d0c13b28f1eaa1d775e4a3)
- [list-exports] [deps] update `npm-packlist`, `read-package-json` [`7d7e3ac`](https://github.com/ljharb/list-exports/commit/7d7e3ac2ed29462cbe9684b172721459bcf06cee)
- [list-exports] [deps] update `array.prototype.flatmap`, `object-inspect`, `object.entries`, `resolve` [`ea6d942`](https://github.com/ljharb/list-exports/commit/ea6d942a0c9a34df1c9d27da4f727032e83bd7ec)
- [Fix] omit RHS inside node_modules [`993d4a6`](https://github.com/ljharb/list-exports/commit/993d4a6824180853faba2ff8e809894031938b9f)
- [list-exports] [fix] properly reject `node_modules` in the RHS (not the LHS) even if URL-encoded [`b90b776`](https://github.com/ljharb/list-exports/commit/b90b776217b4c4acfa75498baad6b087a2ad82bb)
- [*] [dev deps] update `@ljharb/eslint-config`, `ls-engines` [`677f694`](https://github.com/ljharb/list-exports/commit/677f6945eef90d3b5bcdaf6e897317d057f4f81b)
- [{ls,list}-exports] [dev deps] update `@ljharb/eslint-config`, `aud` [`6503361`](https://github.com/ljharb/list-exports/commit/65033617263c4e22893152c03b68b6d29edf3319)
- [ls-exports,list-exports] [meta] specify `directories.test` [`474aaf7`](https://github.com/ljharb/list-exports/commit/474aaf7caf0c5a4d4f5ea5c34eb29cdba9d3f9e8)
- [list-exports] [refactor] use `call-bound` directly [`565474e`](https://github.com/ljharb/list-exports/commit/565474ebfa2671524f60e18ac2c0574634c096eb)
- [list-exports] [refactor] use `safe-array-concat` [`13ea137`](https://github.com/ljharb/list-exports/commit/13ea137c562ffc22d5954c53162671ec983b3798)
- [*] [tests] replace `aud` with `npm audit` [`b9a799f`](https://github.com/ljharb/list-exports/commit/b9a799feeba4c55f137a6aa87aa22300604affaf)
- [list-exports] v2.0.0 [`0f7cd76`](https://github.com/ljharb/list-exports/commit/0f7cd76da046946619a714d9498359b59fe2d5be)
- [*] [deps] update `node-exports-info` [`f350165`](https://github.com/ljharb/list-exports/commit/f350165bac74b658dc76da281c837ed56c70eadd)
- [readme] replace runkit CI badge with shields.io check-runs badge [`dd3657f`](https://github.com/ljharb/list-exports/commit/dd3657f8a8c6caac6fd6608de58977ade8a1cd78)
- [meta] use npm workspaces instead of `lerna` [`62a63ca`](https://github.com/ljharb/list-exports/commit/62a63caf4683e2e0b2d9e7f17e7713f6c8bfd91a)
- [list-exports] [deps] update `npm-packlist` [`59bb4fb`](https://github.com/ljharb/list-exports/commit/59bb4fb754aa9209143a0b37baa20d657f829725)
- [Dev Deps] update `@ljharb/eslint-config`, `aud`, `ls-engines`, `tape` [`434ede5`](https://github.com/ljharb/list-exports/commit/434ede5543a9c4f677763a1f45153492084ea382)
- [Breaking] bump engines.node requirement to match npm 10 [`ea21f72`](https://github.com/ljharb/list-exports/commit/ea21f725f35bfc835e22706c58d52dfdf5003d39)
- [{ls,list}-exports] [dev deps] update `ls-engines` [`dec201e`](https://github.com/ljharb/list-exports/commit/dec201e657fef3d201cf4bba031c7f2b97964e09)
- [*] [meta] add `sideEffects` flag [`c3006e0`](https://github.com/ljharb/list-exports/commit/c3006e0fb86eb502f31a251aa84540263e778e5b)

## [list-exports@1.1.0](https://github.com/ljharb/list-exports/compare/list-exports@1.0.4...list-exports@1.1.0) - 2023-01-26

### Commits

- [Refactor] hoist some functions up to module level [`fe48fd8`](https://github.com/ljharb/list-exports/commit/fe48fd8bee77f6030504371753f52c2b83ce446d)
- [list-exports] [new] add option for excluding conditional exports [`2c9080b`](https://github.com/ljharb/list-exports/commit/2c9080b905d057b43619501b2dc18e602da5a961)
- [*] [dev deps] update `eslint`, `@ljharb/eslint-config`, `aud`, `ls-engines`, `safe-publish-latest`, `tape` [`fa827a8`](https://github.com/ljharb/list-exports/commit/fa827a88216448461dcb5cfe9f173ff19d4db696)
- [list-exports] [deps] update `array.prototype.flatmap`, `npm-packlist`, `object-inspect`, `object.entries`, `read-package-json`, `resolve` [`72d1376`](https://github.com/ljharb/list-exports/commit/72d1376509da0678fbac3b20471f26bf2b42ec56)
- [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `aud`, `auto-changelog`, `has-package-exports`, `is-equal`, `ls-engines`, `object.entries`, `object.fromentries`, `tape` [`5b75db5`](https://github.com/ljharb/list-exports/commit/5b75db51d7e5e724e730cabf6c653376ae0f8156)
- [deps] [list-exports] update `array.prototype.flatmap`, `object-inspect`, `object.entries`, `resolve` [`44c2576`](https://github.com/ljharb/list-exports/commit/44c25769d4e49bdce18403f4d30a7a25e54292f7)
- [list-exports] [deps] update `array.prototype.flatmap`, `npm-packlist`, `object-inspect`, `object.entries` [`3493e4c`](https://github.com/ljharb/list-exports/commit/3493e4c2952c5e41fc6b9c74f0eedec543006691)
- [*] [dev deps] update `eslint`, `@ljharb/eslint-config`, `aud`, `ls-engines`, `tape`, `has-package-exports`, `object.entries`, `object.fromentries`, `resolve` [`3ae6cc5`](https://github.com/ljharb/list-exports/commit/3ae6cc55c6ddb4fbfdf1f81526edc4549a0cb08a)
- [dev deps] [*] update `@ljharb/eslint-config`, `aud`, `json-diff`, `ls-engines`, `object.entries`, `object.fromentries`, `resolve`, `tape` [`ed536e8`](https://github.com/ljharb/list-exports/commit/ed536e83ac7fad32185ad61aef9fe891264bf741)
- [*] [dev deps] update `@ljharb/eslint-config`, `ls-engines`, `tape` [`f3c97a6`](https://github.com/ljharb/list-exports/commit/f3c97a607dc2ca93bec61239e728ace2a66513f1)
- [list-exports] [deps] update `npm-packlist`, `object-inspect`, `read-package-json` [`fd2db4f`](https://github.com/ljharb/list-exports/commit/fd2db4fd5d2bfda0a38be22c8609674edc6de835)
- [*] [dev deps] update `@ljharb/eslint-config`, `has-package-exports`, `ls-engines`, `tape` [`141aa79`](https://github.com/ljharb/list-exports/commit/141aa79f9559febd8677030999e9541167cdd885)
- [list-exports] v1.1.0 [`c7b8f08`](https://github.com/ljharb/list-exports/commit/c7b8f081a1f1243170502088f35ca42e9d92504b)
- [dev deps] update `ls-engines` [`f0a8f6d`](https://github.com/ljharb/list-exports/commit/f0a8f6dc2f10296091d9fa576de4f3720db101fb)
- [list-exports] [deps] update `read-package-json` [`f183802`](https://github.com/ljharb/list-exports/commit/f183802c2117bbc6fadbb1e973d474902c8bf2b4)
- [*] [dev deps] update `ls-engines` [`fdeed25`](https://github.com/ljharb/list-exports/commit/fdeed2517c4ad1fb58e1c67217169825c999c807)
- [*] [dev deps] update `ls-engines` [`3092eff`](https://github.com/ljharb/list-exports/commit/3092effa53445294c49886f080c5bc424fe0846e)
- [*] [dev deps] update `aud` [`84a90dc`](https://github.com/ljharb/list-exports/commit/84a90dcc33bf85b32ef37732e2017ffd1a2146ff)
- [*] [dev deps] update `eslint` [`6feaf81`](https://github.com/ljharb/list-exports/commit/6feaf81eb94b8ba82059987dc976763b95ed2b6d)
- [dev deps] [*] update `ls-engines` [`4e6c417`](https://github.com/ljharb/list-exports/commit/4e6c4178aac295c12c559439d5df094ff2e1a0b7)

## [list-exports@1.0.4](https://github.com/ljharb/list-exports/compare/list-exports@1.0.3...list-exports@1.0.4) - 2020-10-21

### Commits

- [list-exports] [fix] avoid crashing when package.json references a dir that does not exist [`15641bb`](https://github.com/ljharb/list-exports/commit/15641bb5729c190eed97f9713525a7794e2735ef)
- [list-exports] [deps] update `read-package-json`, `resolve` [`6b15d7b`](https://github.com/ljharb/list-exports/commit/6b15d7b2a7e5b5e3d5bb226a91661ee92d41aac6)
- [Dev Deps] update `eslint`, `ls-engines` [`44f196a`](https://github.com/ljharb/list-exports/commit/44f196a36b4e1343ec3c98d47fff58c5a3db543f)
- [list-exports] v1.0.4 [`619eb58`](https://github.com/ljharb/list-exports/commit/619eb580bce1a662ad57a08f7ad98e37d65294f4)
- [*] [dev deps] update `eslint` [`ec1ed66`](https://github.com/ljharb/list-exports/commit/ec1ed66b1538e233b2c4a0ae5a19de1f7e6916fd)

## [list-exports@1.0.3](https://github.com/ljharb/list-exports/compare/list-exports@1.0.2...list-exports@1.0.3) - 2020-09-26

### Commits

- [list-exports] [fix] don't list &lt;export&gt;/ as exported [`29ec7cb`](https://github.com/ljharb/list-exports/commit/29ec7cb827a8f10e09cdf6f564574b5dbe4900b8)
- [Deps] update `read-package-json` [`ddbb5bf`](https://github.com/ljharb/list-exports/commit/ddbb5bf6e402be6b55f98286232ccc883662e3c6)
- [*] [dev deps] update `eslint` [`53e5946`](https://github.com/ljharb/list-exports/commit/53e59468247b479293be20f12e8544e1222f0120)
- [list-exports] [fix] don't normalize rhs values of export objects [`55a0ff7`](https://github.com/ljharb/list-exports/commit/55a0ff72a01a7e7af35d507c4dc104b2e229ed13)
- [Tests] use `ls-engines` in CI to ensure "engines" is valid [`b0e16fb`](https://github.com/ljharb/list-exports/commit/b0e16fbbc924c2be6b45efb4bf681a2e3a9b3fd8)

## [list-exports@1.0.2](https://github.com/ljharb/list-exports/compare/list-exports@1.0.1...list-exports@1.0.2) - 2020-08-18

### Fixed

- [list-exports] [fix] properly handle top-level conditions with nested dotted objects [`#2`](https://github.com/ljharb/list-exports/issues/2)

### Commits

- [*] [Dev Deps] update `eslint`, `@ljharb/eslint-config` [`0b780df`](https://github.com/ljharb/list-exports/commit/0b780dfbb4cb10ab71789523dd92c3ffc1b2b908)
- [list-exports] v1.0.2 [`5bfd761`](https://github.com/ljharb/list-exports/commit/5bfd76184fa226f4c8dd2e0ddd45e036dfb72f80)

## [list-exports@1.0.1](https://github.com/ljharb/list-exports/compare/list-exports@1.0.0...list-exports@1.0.1) - 2020-08-02

### Commits

- [list-exports] read me [`a44f479`](https://github.com/ljharb/list-exports/commit/a44f479891255ac30cc5de697a4a1827d416d86a)
- [list-exports] [fix] properly handle nested `package.json` `type` values [`39d251f`](https://github.com/ljharb/list-exports/commit/39d251f93f50143eaae2d1bb24d6508d9f9e948e)
- [*] [Dev Deps] update `eslint`, `lerna` [`5e15f56`](https://github.com/ljharb/list-exports/commit/5e15f565656bad74032100bc1127735fa3933db6)
- [ls-exports | list-exports] [meta] add `repository.directory` info; fix `ls-exports` repo [`e692b45`](https://github.com/ljharb/list-exports/commit/e692b451432360bfd1bc18bc7abea4b7d4c4142b)
- [list-exports] v1.0.1 [`557cbfb`](https://github.com/ljharb/list-exports/commit/557cbfb7a77054e8323de5c13e7e20dc3f51eb25)
- [list-exports] [deps] update `object-inspect` [`02fad38`](https://github.com/ljharb/list-exports/commit/02fad3844f49d875c757a410ff3628c0eb1725c6)
- [*] [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `lerna`, `tape` [`3ed678a`](https://github.com/ljharb/list-exports/commit/3ed678a89a07d99843d7fe077459ac2c2f0b41d0)
- [list-exports] [deps] update `object.entries` [`e975ef7`](https://github.com/ljharb/list-exports/commit/e975ef7ba8abeadb165ee6489593d5c0766a898e)
- [list-exports | ls-exports] [meta] ensure LICENSE file is present [`f1c4ceb`](https://github.com/ljharb/list-exports/commit/f1c4cebe02dbd3439697f1be190b9d574e646586)

## list-exports@1.0.0 - 2020-05-25

### Commits

- [list-exports] Implementation [`8411f1a`](https://github.com/ljharb/list-exports/commit/8411f1af64e09b8ee338ef3e371c19e7c777442d)
- npm init [`57d5801`](https://github.com/ljharb/list-exports/commit/57d5801201ceb0df5e2b59aef46e8a3269e09193)
- [list-exports | ls-exports] [meta] add `safe-publish-latest` [`feb2fd4`](https://github.com/ljharb/list-exports/commit/feb2fd4205d713dbc3cf42c07cf069e0af097f49)
- Tests [`94b26c6`](https://github.com/ljharb/list-exports/commit/94b26c6b69924ee2bb06dd261fb80b4e1d4c99b7)
- [list-exports] v1.0.0 [`d6164f7`](https://github.com/ljharb/list-exports/commit/d6164f711525ef2346c048d483521c3f35d25089)
- [meta] Only apps should have lockfiles [`008c921`](https://github.com/ljharb/list-exports/commit/008c921ef489a27ff425e2a7c73afa60e43288fe)
