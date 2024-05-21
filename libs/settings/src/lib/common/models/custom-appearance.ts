export type CustomAppearance = {
	[colorKey in CustomStyleKey]: string;
};
export type FinalStyles = {
	[styleKey in FinalStyleKey]: string;
};

export type CustomStyleKey = '--bgs-widget-background-color';
export type FinalStyleKey = '--bgs-widget-background-image';

export const defaultStyleKeys: CustomAppearance = {
	'--bgs-widget-background-color': 'rgba(94, 11, 70, 0.7)',
};
