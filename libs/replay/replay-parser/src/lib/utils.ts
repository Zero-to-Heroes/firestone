import equal from 'deep-equal';

export const deepEqual = (a, b) =>
	equal(a, b, {
		strict: false,
	});
