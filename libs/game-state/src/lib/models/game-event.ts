import { Rank } from '@firestone/memory';

export interface GameEvent {
	readonly type: string;
	readonly cardId: string;
	readonly controllerId: number; // matches a PlayerId
	readonly localPlayer: GameEventPlayer;
	readonly opponentPlayer: GameEventPlayer;
	readonly entityId: number;

	readonly additionalData: any;
}

export interface GameEventPlayer {
	Id: number;
	AccountHi: string;
	AccountLo: string;
	PlayerId: number;
	Name: string;
	CardID: string;
	standard: Rank;
	wild: Rank;
}
