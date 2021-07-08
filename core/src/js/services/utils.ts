import { inflate } from 'pako';
import { PatchInfo } from '../models/patches';

export const groupByFunction = (keyExtractor: (obj: any | string) => string) => (array) =>
	array.reduce((objectsByKeyValue, obj) => {
		const value = keyExtractor(obj);
		objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
		return objectsByKeyValue;
	}, {});

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

export const sumOnArray = <T>(array: readonly T[], prop: (item: T) => number): number => {
	return array.map((item) => prop(item)).reduce((a, b) => a + b, 0);
};

export const formatDate = (theDate: Date): string => {
	return `${theDate.toISOString().slice(0, 10)}`;
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
