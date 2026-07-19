/* eslint-disable */
export default {
	displayName: 'game-state',
	preset: '../../jest.preset.js',
	/**
	 * Bug replay specs live under `test-tools/bugs/` (outside this lib folder).
	 * Non-regression suites (e.g. the rewind corpus) live under `test-tools/non-reg/`.
	 * Performance investigation specs live under `test-tools/perf/`.
	 */
	roots: [
		'<rootDir>',
		'<rootDir>/../../test-tools/bugs',
		'<rootDir>/../../test-tools/non-reg',
		'<rootDir>/../../test-tools/perf',
	],
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
		'<rootDir>/../../test-tools/non-reg/**/*.spec.ts',
		'<rootDir>/../../test-tools/perf/**/*.spec.ts',
	],
};
