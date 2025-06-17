import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Polyfill for structuredClone (needed for modern Node.js and fake-indexeddb)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function structuredClone(obj) {
    // For simple objects, use JSON serialization
    // This is not a complete implementation but works for our test cases
    if (obj === null || obj === undefined) {
      return obj;
    }

    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      // Fallback for objects that can't be JSON serialized
      if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
          return obj.map((item) => structuredClone(item));
        }

        const cloned = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = structuredClone(obj[key]);
          }
        }
        return cloned;
      }

      return obj;
    }
  };
}

// Mock the entire supabase module globally to prevent ESM import errors in all tests
jest.mock('@/lib/supabase', () => ({
  supabase: {},
}));
