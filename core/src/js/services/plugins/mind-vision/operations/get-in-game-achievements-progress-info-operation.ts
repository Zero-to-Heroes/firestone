import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';
import { HsAchievementsInfo } from '../../../achievement/achievements-info';
import { InternalHsAchievementsInfo } from './get-achievements-info-operation';

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
