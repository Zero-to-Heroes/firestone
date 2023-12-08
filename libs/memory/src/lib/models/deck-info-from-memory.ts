import { GameFormat } from '@firestone-hs/reference-data';

export interface DeckInfoFromMemory {
	readonly DeckId?: number;
	readonly Id?: number;
	readonly Name: string;
	readonly DeckList: readonly (string | number)[];
	readonly HeroCardId: string;
	readonly HeroPowerCardId?: string;
	readonly HeroClass?: number;
	readonly FormatType: GameFormat;
	readonly Sideboards?: readonly DeckSideboardFromMemory[];
}

export interface DeckSideboardFromMemory {
	readonly KeyCardId: string;
	readonly Cards: readonly string[];
}
