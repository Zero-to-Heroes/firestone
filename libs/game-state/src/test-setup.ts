import 'jest-preset-angular/setup-jest';

jest.mock('double-ended-queue', () => {
	const actual = jest.requireActual<Record<string, unknown>>('double-ended-queue');
	const Deque = (actual['default'] ?? actual) as new () => unknown;
	return { __esModule: true, default: Deque };
});
