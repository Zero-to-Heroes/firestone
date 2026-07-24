import { formatLogArg } from './format-log-arg';

describe('formatLogArg', () => {
	it('formats small objects on a single line', () => {
		const input = { userId: 'abc', userName: 'test', fullRetrieve: false };
		expect(formatLogArg(input)).toBe('{"userId":"abc","userName":"test","fullRetrieve":false}');
	});

	it('formats large objects on a single line', () => {
		const input = { data: 'x'.repeat(600) };
		const result = formatLogArg(input);
		expect(result).not.toContain('\n');
		expect(result).toBe(JSON.stringify(input));
	});

	it('formats errors with stack', () => {
		const error = new Error('boom');
		expect(formatLogArg(error)).toContain('Error: boom');
		expect(formatLogArg(error)).toContain('at ');
	});
});
