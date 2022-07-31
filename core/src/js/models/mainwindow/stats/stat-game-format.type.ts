import { GameFormat } from '@firestone-hs/reference-data';

export type StatGameFormatType = 'unknown' | 'all' | 'standard' | 'wild' | 'classic';
export const gameFormatToStatGameFormatType = (source: GameFormat): StatGameFormatType => {
	switch (source) {
		case GameFormat.FT_CLASSIC:
			return 'classic';
		case GameFormat.FT_STANDARD:
			return 'standard';
		case GameFormat.FT_UNKNOWN:
			return 'unknown';
		case GameFormat.FT_WILD:
			return 'wild';
		default:
			return 'all';
	}
};
