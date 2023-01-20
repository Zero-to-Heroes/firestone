// import equal from 'fast-deep-equal/es6';
import equal from 'deep-equal';
import { inflate } from 'pako';
import { PatchInfo } from '../models/patches';
import { LocalizationFacadeService } from './localization-facade.service';

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

export const multiGroupByFunction =
	<T>(keyExtractor: (obj: T) => string | number | readonly string[] | readonly number[]) =>
	(array: readonly T[]): { [key: string]: readonly T[] } => {
		return (array ?? []).reduce((objectsByKeyValue, obj) => {
			const valueRaw = keyExtractor(obj);
			const valueArr: readonly string[] | readonly number[] = Array.isArray(valueRaw) ? valueRaw : [valueRaw];
			for (const value of valueArr) {
				objectsByKeyValue[value] = objectsByKeyValue[value] ?? [];
				// Using push instead of concat is thousands of times faster on big arrays
				objectsByKeyValue[value].push(obj);
			}
			return objectsByKeyValue;
		}, {});
	};

// TODO: use the one from common libs instead
export const uuid = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

export const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isWindowClosed = (state: string): boolean => {
	return state === 'closed' || state === 'hidden';
};

export const isWindowHidden = (state: string): boolean => {
	return state !== 'normal' && state !== 'maximized';
};

export const capitalizeFirstLetter = (input: string): string => {
	if (!input) {
		return null;
	}

	const lowerInput = input.toLowerCase();
	return lowerInput.charAt(0).toUpperCase() + lowerInput.slice(1);
};

export const capitalizeEachWord = (input: string): string => {
	const lowerInput = input?.toLowerCase();
	return !lowerInput ? null : lowerInput.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
};

export const isCharLowerCase = (character: string): boolean => {
	return !!character?.length && character === character.toLowerCase() && character !== character.toUpperCase();
};

export const isVersionBefore = (appVersion: string, reference: string): boolean => {
	const appValue = buildAppValue(appVersion);
	const referenceValue = buildAppValue(reference);
	return appValue < referenceValue;
};

const buildAppValue = (appVersion: string): number => {
	const [major, minor, patch] = appVersion.split('.').map((info) => parseInt(info));
	return 1000 * major + 100 * minor + patch;
};

export const deepEqual = (a, b) =>
	equal(a, b, {
		strict: false,
	});
// export const arraysEqual = deepEqual;

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

export const formatDate = (theDate: Date): string => {
	return `${theDate.toISOString().slice(0, 10)}`;
};

export const daysBetweenDates = (date1: string, date2: string): number => {
	const date1Date = new Date(date1);
	const date2Date = new Date(date2);
	return Math.round(Math.abs(date1Date.getTime() - date2Date.getTime()) / (1000 * 60 * 60 * 24));
};

export const addDaysToDate = (timeStamp: number, days: number): Date => {
	const newDate = new Date(timeStamp);
	newDate.setDate(newDate.getDate() + days);
	return newDate;
};

export const formatPatch = (input: PatchInfo, i18n: LocalizationFacadeService): string => {
	if (!input) {
		return '';
	}
	return i18n.translateString('global.patch', {
		version: input.version,
		number: input.number,
		date: input.date.split('-').reverse().join('-'),
	});
};

export const removeFromArray = <T>(array: T[], element: T) => {
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

export const replaceInArray = <T>(array: readonly T[], index: number, element: T): T[] => {
	const ret = array.slice(0);
	ret[index] = element;
	return ret;
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

// For ng2-charts
/* eslint-disable @typescript-eslint/ban-types */
export const thisAsThat = (callBack: Function) => {
	// eslint-disable-next-line @typescript-eslint/no-this-alias
	const self = this;
	return function () {
		return callBack.apply(self, [this].concat(Array.prototype.slice.call(arguments)));
	};
};

export const decode = (input: string): string => {
	const fromBase64 = Buffer.from(input, 'base64').toString();
	const inflated = inflate(fromBase64, { to: 'string' });
	return JSON.parse(inflated);
};

// Because floating point computations are not super reliable and lead to false
// differences between objects
export const cutNumber = (x: number, precision = 10): number => {
	return Math.floor(x * precision) / precision;
};

export const mod = (n: number, m: number): number => {
	return ((n % m) + m) % m;
};

// https://www.just-bi.nl/a-tale-of-a-javascript-memory-leak/
export const freeRegexp = () => /\s*/g.exec('');

export const pickRandom = <T>(array: readonly T[]): T => {
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

export const chunk = <T>(array: T[], size: number): T[][] =>
	array.reduce((acc, _, i) => {
		if (i % size === 0) {
			acc.push(array.slice(i, i + size));
		}
		return acc;
	}, []);

export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
