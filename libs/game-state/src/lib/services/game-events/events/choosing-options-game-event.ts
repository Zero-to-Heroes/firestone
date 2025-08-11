import { GameEvent } from '../game-event';

export class ChoosingOptionsGameEvent extends GameEvent {
	override readonly additionalData: {
		readonly options: {
			readonly EntityId: number;
			readonly CardId: string;
			readonly QuestDifficulty?: number;
			readonly QuestReward?: {
				readonly EntityId: number;
				readonly CardId: string;
			};
		}[];
		readonly context: {
			readonly DataNum1: number;
		};
	};
}
