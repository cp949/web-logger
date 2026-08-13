# @cp949/web-logger-react Changelog

## [1.0.6] - 2026-08-14

### Security

- Updated the workspace development dependency tree until `pnpm audit` reported no vulnerabilities

### Changed

- Updated the React test toolchain for Vite 8, Vitest 4.1, and TypeScript 6
- Rewrote the package README with the current React and Next.js usage requirements

## [1.0.3] - 2025-11-30

### Changed

- Version sync with core package (@cp949/web-logger)
- Updated peer dependency to @cp949/web-logger@^1.0.3
- Reorganized test file structure (moved to tests/ directory)

## [1.0.2] - 2025-11-30

### Changed

- Version sync with core package (@cp949/web-logger)
- Updated peer dependency to @cp949/web-logger@^1.0.2

### Fixed

- Test file organization (moved to tests/ directory)

## [1.0.0] - 2024-11-28

### Added

- Initial release
- `useWebLogger` hook for React applications
- Full TypeScript support
- Automatic instance management with useMemo
- Component-scoped logging with prefix support
- 100% test coverage
