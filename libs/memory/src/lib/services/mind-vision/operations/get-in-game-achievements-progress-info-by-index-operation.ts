import { GameStatusService } from '@firestone/shared/common/service';
import { HsAchievementsInfo } from '../../../external-models/achievements-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';
import { InternalHsAchievementsInfo } from './get-achievements-info-operation';

export class GetInGameAchievementsProgressInfoByIndexOperation extends MindVisionOperationFacade<HsAchievementsInfo> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getInGameAchievementsProgressInfo',
			(forceReset?: boolean, achievementIds?: readonly number[]) =>
				mindVision.getInGameAchievementsProgressInfoByIndex(achievementIds ?? []),
			(info: InternalHsAchievementsInfo) => !info?.Achievements?.length,
			(info: InternalHsAchievementsInfo) =>
				({
					achievements: info.Achievements.map((ach) => ({
						id: ach.AchievementId,
						progress: ach.Progress,
						completed: undefined,
						index: ach.Index,
					})),
				}) as HsAchievementsInfo,
			2,
			1000,
		);
	}
}
