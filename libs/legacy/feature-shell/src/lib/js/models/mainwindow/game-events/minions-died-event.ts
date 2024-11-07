import { GameEvent } from '../../game-event';

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
