import { HsAchievementsInfo } from '../../achievement/achievements-info';
import { OverwolfService } from '../../overwolf.service';
import { InternalHsAchievementsInfo } from './get-achievements-info-operation';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetInGameAchievementsProgressInfoOperation extends MindVisionOperationFacade<HsAchievementsInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getInGameAchievementsProgressInfo',
			() => mindVision.getInGameAchievementsProgressInfo(),
			(info: InternalHsAchievementsInfo) => !info?.Achievements?.length,
			(info: InternalHsAchievementsInfo) =>
				({
					achievements: info.Achievements.map((ach) => ({
						id: ach.AchievementId,
						progress: ach.Progress,
						completed: undefined,
					})),
				} as HsAchievementsInfo),
			2,
			1000,
		);
	}
}
