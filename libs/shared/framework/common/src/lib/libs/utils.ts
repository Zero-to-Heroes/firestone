export const arraysEqual = (a: readonly any[] | any, b: readonly any[] | any): boolean => {
	if (a == null && b == null) {
		return true;
	}
	if ((a == null && b != null) || (a != null && b == null)) {
		return false;
	}
	if (a === b) {
		return true;
	}
	if (!Array.isArray(a) || !Array.isArray(b)) {
		return false;
	}
	return (
		a.length === b.length &&
		// deepEqual is pretty fast, so we can check for full equality here, especially since a non-equality usually means
		// rerendering something, which is much more costly
		a.every((el, ix) => {
			return Array.isArray(el) ? arraysEqual(el, b[ix]) : el == b[ix];
		})
	);
};

export const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const uuid = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};
