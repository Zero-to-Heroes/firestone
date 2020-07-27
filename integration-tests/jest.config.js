module.exports = {
	roots: ['<rootDir>', '<rootDir>/../core'],
	setupFilesAfterEnv: ['<rootDir>/../core/test/setup.js', 'jest-extended'],
	testEnvironment: 'node',
	transform: {
		// https://stackoverflow.com/questions/58096872/react-jest-test-fails-to-run-with-ts-jest-unexpected-token-on-imported-file
		'^.+\\.jsx?$': 'babel-jest',
		'^.+\\.tsx?$': 'ts-jest',
		'^.+\\.txt$': 'jest-text-transformer',
		'^.+\\.log$': 'jest-text-transformer',
	},
	globals: {
		'ts-jest': {
			'tsConfig': '<rootDir>/tsconfig.json',
		},
	},
	testMatch: ['**/*.test.ts'],
	transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\](?!lodash-es/).+\\.js$'],
	verbose: true,
};
