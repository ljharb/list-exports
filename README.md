# list-exports monorepo

## 📦 Packages

This repository is a **monorepo** that hosts related packages: 

- [`list-exports`](./packages/list-exports/) — core library that lists export specifiers from `package.json`.  
  [View README](./packages/list-exports/README.md)

- [`ls-exports`](./packages/ls-exports/) — CLI tool for listing exports.  
  [View README](./packages/ls-exports/README.md)

---

## 📁 Repository Layout

- `.github/` → GitHub workflows, funding info  
- `packages/` → contains the two main packages:
  - [`list-exports/`](./packages/list-exports) → core library (see its [exports](./packages/list-exports/package.json#L"exports"))  
  - [`ls-exports/`](./packages/ls-exports) → CLI tool (see its [exports](./packages/ls-exports/package.json#L"exports"))  
- `tests/` → test files and fixtures  
- Root configs, eg: `.eslintrc`, `.eslintignore`, `.npmrc`, `.gitignore`

---

## 🙋‍♀️ Contributing

We welcome contributions! Please:
- Fork the repo and create your branch from `main`.
- Run `npm install` to install dependencies.
- Run tests with `npm test` before opening a PR.
- Follow the existing code style and conventions.

---

## 🙌 Shoutouts

Thanks to [Jordan Harband](https://github.com/ljharb) and all contributors for maintaining this project.

---

[license-image]: https://img.shields.io/npm/l/list-exports.svg
[license-url]: LICENSE
[codecov-image]: https://codecov.io/gh/ljharb/list-exports/branch/main/graph/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/list-exports/
[actions-image]: https://img.shields.io/endpoint?url=https://github-actions-badge-u3jn4tfpocch.runkit.sh/ljharb/list-exports/actions
[actions-url]: https://github.com/ljharb/list-exports/actions
