export type CustomAppearance = {
	[colorKey in CustomStyleKey]: string;
};
export type FinalStyles = {
	[styleKey in FinalStyleKey]: string;
};

export type CustomStyleKey = '--bgs-widget-background-color';
export type FinalStyleKey =
	| '--bgs-simulation-widget-background-image'
	| '--bgs-session-widget-background-image'
	| '--bgs-minions-list-widget-background-image';

export const defaultStyleKeys: CustomAppearance = {
	'--bgs-widget-background-color': 'rgba(94, 11, 70, 0.7)',
};
