import { GameFormat } from '@firestone-hs/reference-data';

export interface DeckInfoFromMemory {
	readonly DeckId?: number;
	readonly Name: string;
	readonly DeckList: readonly (string | number)[];
	readonly HeroCardId: string;
	readonly HeroClass?: number;
	readonly FormatType: GameFormat;
}
