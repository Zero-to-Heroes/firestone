export interface JsonEvent {
	readonly name: EventName;
	readonly time: Date;
	readonly data: any;
}

export type EventName = 'bgsPrizePicked' | 'bgsBattleResult' | 'bgsBattleStart' | 'cards-in-hand' | 'card-draw';
