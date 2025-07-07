import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the entire db.server module
vi.mock('~/lib/db.server', async () => {
  return {
    db: {
      level: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      userProgress: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      problem: {
        findUnique: vi.fn(),
      },
      userAttempt: {
        create: vi.fn(),
      },
    },
  };
});
