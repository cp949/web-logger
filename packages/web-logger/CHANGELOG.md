# @cp949/web-logger Changelog

## [1.0.3] - 2025-11-30

### Changed

- Reorganized test file structure (moved to tests/ directory)

### Fixed

- Fixed documentation to match implementation
- Updated sensitive keys documentation (28 keys total)

## [1.0.2] - 2025-11-30

### Added

- Component-scoped prefix support with `withPrefix()` method
- Comprehensive API documentation for all public functions

### Fixed

- Test file organization (moved to tests/ directory)

## [1.0.1] - 2024-11-29

### Added

- SSR/CSR compatibility improvements
- Tree-shaking optimization support

## [1.0.0] - 2024-11-28

### Added

- Initial release
- Automatic sensitive data filtering (28 default keys)
- Pattern-based filtering for emails, phones, SSNs, credit cards
- Runtime log level control
- ReDoS attack prevention
- Prototype pollution prevention
- Full TypeScript support
