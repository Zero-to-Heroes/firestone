import { AchievementsProgress } from '../../../models/achievement/achievement-progress';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';

export class ConstructedAchievementsProgressionEvent implements GameStateEvent {
	readonly type: string = GameEvent.ACHIEVEMENT_PROGRESS;

	constructor(public readonly progress: AchievementsProgress) {}
}
