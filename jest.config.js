module.exports = {
	roots: ['<rootDir>/src', '<rootDir>/test'],
	setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
	testEnvironment: 'node',
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
		'^.+\\.txt$': 'jest-text-transformer',
		'^.+\\.log$': 'jest-text-transformer',
	},
	testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/test/**/*.test.ts'],
	transformIgnorePatterns: ['<rootDir>/node_modules/'],
	verbose: true,
};
