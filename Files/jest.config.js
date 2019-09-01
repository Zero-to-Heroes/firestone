module.exports = {
	roots: ['<rootDir>/src', '<rootDir>/test'],
	setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
		'^.+\\.txt$': 'jest-text-transformer',
		'^.+\\.log$': 'jest-text-transformer',
	},
	testMatch: ['<rootDir>/**/*.test.ts'],
	transformIgnorePatterns: ['<rootDir>/node_modules/'],
	verbose: true,
};
