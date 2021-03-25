import { GameFormat } from '@firestone-hs/reference-data';

export interface DeckInfoFromMemory {
	readonly Name: string;
	readonly DeckList: readonly (string | number)[];
	readonly HeroCardId: string;
	readonly FormatType: GameFormat;
}
