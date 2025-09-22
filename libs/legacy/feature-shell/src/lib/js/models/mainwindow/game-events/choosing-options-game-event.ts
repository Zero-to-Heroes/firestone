import { GameEvent } from '@firestone/shared/common/service';

export class ChoosingOptionsGameEvent extends GameEvent {
	readonly additionalData: {
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
