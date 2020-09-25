export const groupByFunction = (keyExtractor: (obj: object | string) => string) => array =>
	array.reduce((objectsByKeyValue, obj) => {
		const value = keyExtractor(obj);
		objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
		return objectsByKeyValue;
	}, {});

export const uuid = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

export const sleep = ms => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

export const isWindowClosed = (state: string): boolean => {
	return state === 'closed' || state === 'hidden';
};

export const isWindowHidden = (state: string): boolean => {
	return state !== 'normal' && state !== 'maximized';
};

export const capitalizeFirstLetter = (input: string): string => {
	return input.charAt(0).toUpperCase() + input.slice(1);
};

export const capitalizeEachWord = (input: string): string => {
	return input.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export const isCharLowerCase = (character: string): boolean => {
	return character === character.toLowerCase() && character !== character.toUpperCase();
};

export const arraysEqual = (a: readonly any[] | any[], b: readonly any[] | any[]): boolean => {
	if (a == null && b == null) {
		return true;
	}
	if ((a == null && b != null) || (a != null && b == null)) {
		return false;
	}
	if (!Array.isArray(a) || !Array.isArray(b)) {
		return false;
	}
	return a.length === b.length && a.every((el, ix) => el === b[ix]);
};
