import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';

export interface Challenge {

	detect(gameEvent: GameEvent, callback: Function);

	// achieve(): Achievement;
	getAchievementId(): string;

	defaultAchievement(): CompletedAchievement;
}
