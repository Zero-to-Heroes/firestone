import { inflate } from 'pako';
import { PatchInfo } from '../models/patches';

export const groupByFunction = <T>(keyExtractor: (obj: T) => string) => (
	array: readonly T[],
): { [key: string]: readonly T[] } => {
	return array.reduce((objectsByKeyValue, obj) => {
		const value = keyExtractor(obj);
		objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
		return objectsByKeyValue;
	}, {});
};

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
	return character === character.toLowerCase() && character !== character.toUpperCase();
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

export const arraysEqual = (a: readonly any[] | any[], b: readonly any[] | any[]): boolean => {
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
	return a.length === b.length && a.every((el, ix) => (Array.isArray(el) ? arraysEqual(el, b[ix]) : el === b[ix]));
};

export const areDeepEqual = (a: any, b: any): boolean => {
	return JSON.stringify(a) == JSON.stringify(b);
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

export const formatPatch = (input: PatchInfo): string => {
	if (!input) {
		return '';
	}
	return `Patch ${input.version}.${input.number} released on ${input.date.split('-').reverse().join('-')}`;
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

export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
