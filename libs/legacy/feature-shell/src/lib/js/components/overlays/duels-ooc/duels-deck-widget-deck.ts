export interface DuelsDeckWidgetDeck {
	readonly id: string;
	readonly heroCardId: string;
	readonly heroPowerCardId: string;
	readonly signatureTreasureCardId: string;
	readonly initialDeckList: string;
	readonly finalDeckList: string;
	readonly mmr: number;
	readonly type: 'duels' | 'paid-duels';
	readonly wins: number;
	readonly losses: number;
	readonly treasureCardIds: readonly string[];
	readonly isLastPersonalDeck: boolean;
	readonly dustCost: number;
}
