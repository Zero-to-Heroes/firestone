import { GameStateEvent } from '@firestone/app/common';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { AchievementsProgress } from '../../../models/achievement/achievement-progress';

export class ConstructedAchievementsProgressionEvent implements GameStateEvent {
	readonly type: string = GameEvent.ACHIEVEMENT_PROGRESS;

	constructor(public readonly progress: AchievementsProgress) {}
}
