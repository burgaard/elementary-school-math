# Test Setup

This directory contains unit tests for the Math Adventure App using Vitest.

## Running Tests

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui
```

## Test Structure

### Setup
- `setup.ts` - Test setup file that mocks Prisma client and configures testing environment
- Configured to run in `jsdom` environment for DOM testing

### Test Files
- `level.test.ts` - Comprehensive tests for the level route loader and action functions

## Test Coverage

The level route tests cover:

### Loader Function
- ✅ Successful data loading (level, user, progress)
- ✅ Error handling for missing parameters
- ✅ Error handling for missing level/user
- ✅ Handling null progress data

### Action Function - Submit Answer
- ✅ Correct answer submission for all grades
- ✅ Wrong answer handling for 1st/2nd grade (second chance logic)
- ✅ Wrong answer handling for 3rd+ grade (immediate finality)
- ✅ Progress creation and updates
- ✅ Error handling for missing problem/user

### Action Function - Complete Level
- ✅ Level completion with 80%+ accuracy
- ✅ Redirect on successful completion
- ✅ "Need more practice" for < 80% accuracy
- ✅ Error handling for missing data

### Action Function - Invalid Actions
- ✅ Proper 400 error responses

## Mock Strategy

The tests use Vitest's mocking capabilities to:
- Mock the Prisma database client (`~/lib/db.server`)
- Mock Remix's `redirect` function
- Create realistic test data with proper TypeScript types

## Configuration

Tests are configured in `vite.config.ts` to:
- Exclude Remix plugin during testing to avoid server-only module restrictions
- Use custom resolve aliases for the `~` path
- Include proper test environment setup
