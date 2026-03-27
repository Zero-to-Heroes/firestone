/* eslint-disable */
export default {
	displayName: 'replay/replay-parser',
	preset: '../../../jest.preset.js',
	setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.spec.json',
			stringifyContentPathRegex: '\\.(html|svg)$',
		},
	},
	coverageDirectory: '../../../coverage/libs/replay/replay-parser',
	transform: {
		'^.+\\.(ts|mjs|js|html)$': 'jest-preset-angular',
	},
	transformIgnorePatterns: ['node_modules/(?!(deep-equal|is-date-object|is-regexp|is-arguments|object-is|is-nan|es-abstract|has-tostringtag|has-symbols|.*\\.mjs$))'],
	snapshotSerializers: [
		'jest-preset-angular/build/serializers/no-ng-attributes',
		'jest-preset-angular/build/serializers/ng-snapshot',
		'jest-preset-angular/build/serializers/html-comment',
	],
};
