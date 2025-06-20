import createJestConfig from 'next/jest.js';

const nextJest = createJestConfig({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/types/**/*',
    ],
    transformIgnorePatterns: [
        'node_modules/(?!(@supabase|@babel|uuid|postgres|query-string|decode-uri-component|strict-uri-encode|split-on-first|filter-obj)/)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default nextJest(customJestConfig); 