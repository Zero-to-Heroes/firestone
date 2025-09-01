import { GameFormat, GameType } from '@firestone-hs/reference-data';

export interface DeckInfoFromMemory {
	readonly DeckId?: number;
	readonly Id?: string;
	readonly Name: string;
	readonly GameType?: GameType;
	readonly Losses?: number;
	readonly Wins?: number;
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
