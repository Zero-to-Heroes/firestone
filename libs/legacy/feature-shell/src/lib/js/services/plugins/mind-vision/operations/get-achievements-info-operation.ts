import { HsAchievementsInfo } from '@services/achievement/achievements-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetAchievementsInfoOperation extends MindVisionOperationFacade<HsAchievementsInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getAchievementsInfo',
			() => mindVision.getAchievementsInfo(),
			(info: InternalHsAchievementsInfo) => !info?.Achievements?.length,
			(info: InternalHsAchievementsInfo) =>
				({
					achievements: info.Achievements.map((ach) => ({
						id: ach.AchievementId,
						progress: ach.Progress,
						completed: [2, 4].includes(ach.Status),
					})),
				} as HsAchievementsInfo),
			5,
			3000,
		);
	}
}

export interface InternalHsAchievementsInfo {
	readonly Achievements: readonly InternalHsAchievementInfo[];
}

export interface InternalHsAchievementInfo {
	readonly AchievementId: number;
	readonly Progress: number;
	readonly Status: number;
}
