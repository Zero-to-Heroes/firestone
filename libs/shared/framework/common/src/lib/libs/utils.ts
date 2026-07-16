import equal from 'deep-equal';
import { inflate } from 'pako';

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
export const groupByFunction2 = <T>(
	array: readonly T[],
	keyExtractor: (obj: T) => string | number,
): { [key: string]: readonly T[] } => {
	return (array ?? []).reduce((objectsByKeyValue, obj) => {
		const value = keyExtractor(obj);
		objectsByKeyValue[value] = objectsByKeyValue[value] ?? [];
		// Using push instead of concat is thousands of times faster on big arrays
		objectsByKeyValue[value].push(obj);
		return objectsByKeyValue;
	}, {});
};

/**
 * @deprecated it looks like this is more resource-consuming than I thought
 * We should do manually crafting comparisons, and refactor the code to use the smallest possible objects
 * */
export const deepEqual = (a, b) =>
	equal(a, b, {
		strict: false,
	});

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
		a.every((el, ix) => {
			return Array.isArray(el) ? arraysEqual(el, b[ix]) : el == b[ix];
		})
	);
};

const isPlainObject = (value: any): boolean => {
	if (value == null || typeof value !== 'object') {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

/**
 * Default equality used to deduplicate stream emissions: `===` for primitives and class instances,
 * `arraysEqual` for arrays, and a shallow key-by-key comparison for plain object literals (the
 * common case of extracting `{ a: x.a, b: x.b }` slices from a bigger state object, where each
 * extraction creates a fresh - but often identical - object).
 */
export const shallowEqual = (a: any, b: any): boolean => {
	if (a === b) {
		return true;
	}
	if (Array.isArray(a) || Array.isArray(b)) {
		return arraysEqual(a, b);
	}
	if (!isPlainObject(a) || !isPlainObject(b)) {
		// Also handles null/undefined combinations (a === b already returned for both null)
		return a == null && b == null;
	}
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) {
		return false;
	}
	return aKeys.every((key) => (Array.isArray(a[key]) ? arraysEqual(a[key], b[key]) : a[key] === b[key]));
};

export const sumOnArray = <T>(array: readonly T[], prop: (item: T) => number): number => {
	return array?.map((item) => prop(item)).reduce((a, b) => a + b, 0) ?? 0;
};

export const shuffleArray = <T>(array: T[]): T[] => {
	const shuffledArray = [...array]; // Create a copy of the original array

	for (let i = shuffledArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1)); // Generate a random index

		// Swap elements at indices i and j
		[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
	}

	return shuffledArray;
};

export const updateFirstElementWithoutProp = <T>(
	array: readonly T[],
	propSelector: (entity: T) => any,
	base: T | Partial<T> | NonFunctionProperties<T> | Partial<NonFunctionProperties<T>>,
): readonly T[] => {
	if (!array?.length) {
		return [];
	}
	const withoutPropertyElements = array.filter((e) => !propSelector(e));
	if (!withoutPropertyElements.length) {
		// console.warn('could not find any element without property', propSelector, array);
		return array;
	}
	const indexWithoutProperty = array.indexOf(withoutPropertyElements[0]);
	return replaceInArray(array, indexWithoutProperty, base as T);
};

export const replaceInArray = <T>(array: readonly T[], index: number, element: T): T[] => {
	const ret = array.slice(0);
	ret[index] = element;
	return ret;
};

export const pickLast = <T>(array: readonly T[]): T | null => {
	if (!array?.length) {
		return null;
	}
	return array[array.length - 1];
};

export const anyOverlap = <T>(a: readonly T[], b: readonly T[]): boolean => {
	if (!a?.length || !b?.length) {
		return false;
	}

	return a.some((x) => b.includes(x));
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

export const uuidShort = () => {
	return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
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
			if (aProps[i] != bProps[i]) {
				return aProps[i] == null ? -1 : bProps[i] == null ? 1 : aProps[i] < bProps[i] ? -1 : 1;
			}
		}
		return 0;
	};
};

export const pickRandom = <T>(array: readonly T[]): T | null => {
	if (!array?.length) {
		return null;
	}
	return array[Math.floor(Math.random() * array.length)];
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

export const capitalizeFirstLetter = (input: string | null | undefined): string | null => {
	if (!input) {
		return null;
	}

	const lowerInput = input.toLowerCase();
	return lowerInput.charAt(0).toUpperCase() + lowerInput.slice(1);
};

export const buildPercents = (value: number, locale?: string): string => {
	if (value == null) {
		return '-';
	}
	locale = locale ?? 'en-US';
	const fractionDigits = value < 10 ? 2 : 1;
	return (
		(100 * value).toLocaleString(locale, {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}) + '%'
	);
};

export const removeFromArray = <T>(array: T[], element: T): void => {
	const index = array.indexOf(element, 0);
	if (index > -1) {
		array.splice(index, 1);
	}
};

export const removeFromReadonlyArray = <T>(array: readonly T[], index: number): T[] => {
	const ret = array.slice(0);
	if (index > -1) {
		ret.splice(index, 1);
	}
	return ret;
};

export const decodeBase64 = (input: string): string => {
	const fromBase64 = Buffer.from(input, 'base64').toString();
	const inflated = inflate(fromBase64, { to: 'string' });
	return JSON.parse(inflated);
};

// Returns the date string (YYYY-MM-DD) for the Monday of the current week
export const getCurrentWeekStartMonday = (): string => {
	const now = new Date();
	const day = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
	const diff = (day + 6) % 7; // 0 (Sun) -> 6, 1 (Mon) -> 0, ..., 6 (Sat) -> 5
	const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
	// Format as YYYY-MM-DD in local time
	const year = monday.getFullYear();
	const month = String(monday.getMonth() + 1).padStart(2, '0');
	const date = String(monday.getDate()).padStart(2, '0');
	return `${year}-${month}-${date}`;
};

export const chunk = <T>(array: readonly T[], chunkSize: number): T[][] => {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
};

// https://www.just-bi.nl/a-tale-of-a-javascript-memory-leak/
export const freeRegexp = () => /\s*/g.exec('');

export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
export type Mutable<T> = {
	-readonly [k in keyof T]: T[k];
};
