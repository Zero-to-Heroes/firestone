export const groupByFunction =
	<T>(keyExtractor: (obj: T) => string | number) =>
	(array: readonly T[]): { [key: string]: readonly T[] } => {
		return (array ?? []).reduce((objectsByKeyValue, obj) => {
			const value = keyExtractor(obj);
			objectsByKeyValue[value] = objectsByKeyValue[value] ?? [];
			// Using push instead of concat is thousands of times faster on big arrays
			objectsByKeyValue[value].push(obj);
			return objectsByKeyValue;
		}, {});
	};

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

export const sumOnArray = <T>(array: readonly T[], prop: (item: T) => number): number => {
	return array?.map((item) => prop(item)).reduce((a, b) => a + b, 0) ?? 0;
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

export const sortByProperties = <T>(sorter: (t: T) => any[]): ((a: T, b: T) => number) => {
	return (a: T, b: T): number => {
		const aProps = sorter(a);
		const bProps = sorter(b);
		for (let i = 0; i < aProps.length; i++) {
			if (aProps[i] !== bProps[i]) {
				return aProps[i] < bProps[i] ? -1 : 1;
			}
		}
		return 0;
	};
};

export const getStandardDeviation = (array: readonly number[]): { mean: number; standardDeviation: number } => {
	if (!array?.length) {
		return {
			mean: 0,
			standardDeviation: 0,
		};
	}

	const n = array.length;
	const mean = array.reduce((a, b) => a + b) / n;
	const deviation = Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
	return {
		mean: mean,
		standardDeviation: deviation,
	};
};

export const capitalizeEachWord = (input: string): string | null => {
	const lowerInput = input?.toLowerCase();
	return !lowerInput ? null : lowerInput.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
};

export const capitalizeFirstLetter = (input: string): string | null => {
	if (!input) {
		return null;
	}

	const lowerInput = input.toLowerCase();
	return lowerInput.charAt(0).toUpperCase() + lowerInput.slice(1);
};

export const removeFromReadonlyArray = <T>(array: readonly T[], index: number): T[] => {
	const ret = array.slice(0);
	if (index > -1) {
		ret.splice(index, 1);
	}
	return ret;
};

export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
