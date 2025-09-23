import { GameEvent } from '@firestone/game-state';

export class MinionsDiedEvent extends GameEvent {
	readonly additionalData: {
		deadMinions: [
			{
				CardId: string;
				EntityId: number;
				ControllerId: number;
				Cost: number;
				Timestamp: string;
			},
		];
		activePlayerId: number;
	};
}
