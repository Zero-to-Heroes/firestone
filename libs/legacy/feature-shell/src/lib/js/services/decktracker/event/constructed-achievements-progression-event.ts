import { GameEvent, GameStateEvent } from '@firestone/game-state';
import { AchievementsProgress } from '../../../models/achievement/achievement-progress';

export class ConstructedAchievementsProgressionEvent implements GameStateEvent {
	readonly type: string = GameEvent.ACHIEVEMENT_PROGRESS;

	constructor(public readonly progress: AchievementsProgress) {}
}
