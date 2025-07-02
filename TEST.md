# Unit Tests for Git KLOC Analyzer

This is a comprehensive unit test suite for `git-kloc-analyzer`, focusing on testing the core KLOC (Kilo Lines of Code) calculation logic.

## Test Structure

### 1. KLOC Calculation Tests
Tests the core KLOC calculation logic from lines of code:
- Calculate KLOC from lines added (1000 lines = 1.00 KLOC)
- Round to 2 decimal places
- Handle edge cases (0 lines, large numbers, small numbers)

### 2. Net Lines Calculation Tests
Tests net lines calculation:
- Net lines = Lines Added - Lines Deleted
- Handle negative net lines scenarios

### 3. Date Validation Tests
Tests date validation logic:
- Correct date format (YYYY-MM-DD)
- Invalid date format
- Invalid date range (from > to)

### 4. Repository Validation Tests
Tests repository validation:
- Non-existent repository path
- Directory that is not a Git repository

### 5. Integration Tests
Tests integration with mocked Git commands:
- Process git log output
- Calculate stats for multiple contributors
- Handle empty output scenarios

### 6. Utility Function Tests
Tests utility functions:
- Format numbers with thousand separators

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Coverage Report

Current test coverage:
- **Statements**: ~49%
- **Branches**: ~32%
- **Functions**: ~57%
- **Lines**: ~50%

## Mocking Strategy

Tests use Jest mocking to:
- Mock `fs` module to control file system operations
- Mock `child_process.execSync` to simulate Git commands
- Avoid dependencies on actual Git repositories

## Test Focus

These unit tests focus on:
1. **Core Logic**: Main KLOC calculation logic
2. **Edge Cases**: Boundary conditions and exception handling
3. **Input Validation**: Validation of input parameters
4. **Integration**: Integration with Git commands (mocked)

## Notes

- Tests do not require an actual Git repository
- All Git commands are mocked
- Tests cover error cases and edge scenarios
- Focus on business logic rather than infrastructure code