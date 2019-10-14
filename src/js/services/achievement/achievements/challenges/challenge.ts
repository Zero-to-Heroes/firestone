import { CompletedAchievement } from '../../../../models/completed-achievement';
import { GameEvent } from '../../../../models/game-event';

export interface Challenge {
	readonly achievementId: string;

	detect(gameEvent: GameEvent, callback: Function);
	defaultAchievement(): CompletedAchievement;
	getRecordPastDurationMillis(): number;
	getRecordingDuration(): number;
	notificationTimeout(): number;
}
