# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-11-30

### Changed
- Improved documentation accuracy and completeness
- Reorganized test file structure (moved from `src/` to `tests/` directory)
- Enhanced bundle size documentation with accurate metrics

### Fixed
- Fixed log level priority documentation (runtime globals have highest priority)
- Updated sensitive keys documentation to match implementation (28 keys total)
- Corrected BUNDLE_SIZE.md by removing references to non-existent features
- Fixed test import paths after directory reorganization

### Documentation
- Added complete API documentation for all public functions
- Clarified build-time constant usage (__INITIAL_LOG_LEVEL__)
- Enhanced Korean documentation (README.ko.md)
- Added comprehensive CHANGELOG files for each package

## [1.0.2] - 2025-11-30

### Added
- Component-scoped prefix support with `withPrefix()` method
- Comprehensive ROADMAP.md for future development planning
- Complete API documentation for all public functions
- Korean documentation (README.ko.md)

### Changed
- Updated React adapter package to version 1.0.2 (from 1.0.0)
- Moved test files from `src/` to `tests/` directory for better organization
- Enhanced documentation with correct log level priority information
- Improved bundle size documentation with accurate metrics

### Fixed
- Fixed log level priority documentation (runtime globals have highest priority)
- Updated sensitive keys documentation to match implementation (28 keys total)
- Corrected BUNDLE_SIZE.md removing non-existent features
- Fixed test import paths after directory reorganization

### Security
- Documented all 28 default sensitive keys for transparency
- Added documentation for ReDoS attack prevention mechanisms
- Clarified prototype pollution prevention features

## [1.0.1] - 2024-11-29

### Added
- Initial release with comprehensive documentation improvements
- SSR/CSR compatibility documentation
- Tree-shaking optimization support

## [1.0.0] - 2024-11-28

### Added
- Core logging functionality with automatic sensitive data filtering
- Two-tier masking priority system (key-based → pattern-based)
- Build-time constants support (__INITIAL_LOG_LEVEL__)
- Runtime global variables (globalThis.__WEB_LOGGER_LOG_LEVEL__)
- Singleton pattern for global managers
- ReDoS attack prevention
- Prototype pollution prevention
- Console API compatibility
- TypeScript support with comprehensive type definitions
- React hooks adapter (@cp949/web-logger-react)

### Features
- **Automatic sensitive data filtering**: 28 default sensitive keys
- **Pattern-based filtering**: Email, phone, SSN, credit card patterns
- **Runtime log level control**: Dynamic log level adjustment
- **Component-scoped logging**: Prefix support for better log organization
- **Performance optimized**: WeakMap caching, tree-shaking support
- **Security focused**: Multiple attack prevention mechanisms
- **Cross-platform**: SSR/CSR/Node.js compatibility