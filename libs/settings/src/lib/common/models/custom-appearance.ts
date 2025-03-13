export type CustomAppearance = {
	[colorKey in CustomStyleKey]: string;
};
export type FinalStyles = {
	[styleKey in FinalStyleKey]: string | undefined;
};

export type CommonStyleKey =
	| '--bgs-color-1'
	| '--bgs-color-2'
	| '--bgs-color-3'
	| '--bgs-color-4'
	| '--bgs-color-5'
	| '--bgs-color-6'
	| '--bgs-color-7'
	| '--bgs-color-8'
	| '--bgs-color-9';
export type CustomStyleKey = '--bgs-widget-background-color' | CommonStyleKey;
export type FinalStyleKey =
	| '--bgs-simulation-widget-background-image'
	| '--bgs-session-widget-background-image'
	| '--bgs-minions-list-widget-background-image'
	| CommonStyleKey;

let defaultStyleKeysValue: CustomAppearance | null = null;
export const defaultStyleKeys = async (): Promise<CustomAppearance> => {
	if (!!defaultStyleKeysValue) {
		return defaultStyleKeysValue;
	}

	const tempElement = document.createElement('div');
	tempElement.className = 'battlegrounds-theme';
	document.body.appendChild(tempElement);

	const computedStyle = getComputedStyle(tempElement);
	console.debug('computedStyle', computedStyle, tempElement);
	const bgsColor1 = computedStyle.getPropertyValue('--color-1').trim();
	const bgsColor2 = computedStyle.getPropertyValue('--color-2').trim();
	const bgsColor3 = computedStyle.getPropertyValue('--color-3').trim();
	const bgsColor4 = computedStyle.getPropertyValue('--color-4').trim();
	const bgsColor5 = computedStyle.getPropertyValue('--color-5').trim();
	const bgsColor6 = computedStyle.getPropertyValue('--color-6').trim();
	const bgsColor7 = computedStyle.getPropertyValue('--color-7').trim();
	const bgsColor8 = computedStyle.getPropertyValue('--color-8').trim();
	const bgsColor9 = computedStyle.getPropertyValue('--color-9').trim();

	document.body.removeChild(tempElement);

	defaultStyleKeysValue = {
		'--bgs-widget-background-color': 'rgba(94, 11, 70, 0.7)',
		'--bgs-color-1': bgsColor1,
		'--bgs-color-2': bgsColor2,
		'--bgs-color-3': bgsColor3,
		'--bgs-color-4': bgsColor4,
		'--bgs-color-5': bgsColor5,
		'--bgs-color-6': bgsColor6,
		'--bgs-color-7': bgsColor7,
		'--bgs-color-8': bgsColor8,
		'--bgs-color-9': bgsColor9,
	};
	return defaultStyleKeysValue;
};
