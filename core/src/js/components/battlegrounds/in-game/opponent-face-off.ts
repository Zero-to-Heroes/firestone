export interface OpponentFaceOff {
	readonly name: string;
	readonly cardId: string;
	readonly heroPowerCardId: string;
	readonly wins: number;
	readonly losses: number;
	readonly ties: number;
	readonly health: number;
	readonly maxHealth: number;
	readonly isNextOpponent: boolean;
}
