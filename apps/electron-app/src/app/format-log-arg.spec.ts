import { formatLogArg, COMPACT_LOG_THRESHOLD } from './format-log-arg';

describe('formatLogArg', () => {
	it('formats small objects on a single line', () => {
		const input = { userId: 'abc', userName: 'test', fullRetrieve: false };
		expect(formatLogArg(input)).toBe('{"userId":"abc","userName":"test","fullRetrieve":false}');
	});

	it('pretty-prints large objects', () => {
		const input = { data: 'x'.repeat(COMPACT_LOG_THRESHOLD) };
		const result = formatLogArg(input);
		expect(result).toContain('\n');
	});

	it('formats errors with stack', () => {
		const error = new Error('boom');
		expect(formatLogArg(error)).toContain('Error: boom');
		expect(formatLogArg(error)).toContain('at ');
	});
});
