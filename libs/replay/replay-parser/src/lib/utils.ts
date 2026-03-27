import * as deepEqualModule from 'deep-equal';

const equal: typeof deepEqualModule = (deepEqualModule as any).default ?? deepEqualModule;

export const deepEqual = (a, b) =>
	equal(a, b, {
		strict: false,
	});
