import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

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
