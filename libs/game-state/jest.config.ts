/* eslint-disable */
export default {
	displayName: 'game-state',
	preset: '../../jest.preset.js',
	/** Bug replay specs live under `test-tools/bugs/` (outside this lib folder). */
	roots: ['<rootDir>', '<rootDir>/../../test-tools/bugs'],
	setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.spec.json',
			stringifyContentPathRegex: '\\.(html|svg)$',
		},
	},
	coverageDirectory: '../../coverage/libs/game-state',
	transform: {
		'^.+\\.(ts|mjs|js|html)$': 'jest-preset-angular',
	},
	transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
	snapshotSerializers: [
		'jest-preset-angular/build/serializers/no-ng-attributes',
		'jest-preset-angular/build/serializers/ng-snapshot',
		'jest-preset-angular/build/serializers/html-comment',
	],
	testMatch: [
		'<rootDir>/src/**/*.spec.ts',
		'<rootDir>/../../test-tools/bugs/**/*.spec.ts',
	],
};
