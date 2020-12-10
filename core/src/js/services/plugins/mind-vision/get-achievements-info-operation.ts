import { HsAchievementsInfo } from '../../achievement/achievements-info';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetAchievementsInfoOperation extends MindVisionOperationFacade<HsAchievementsInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getAchievementsInfo',
			() => mindVision.getAchievementsInfo(),
			(info: InternalHsAchievementsInfo) => !info?.Achievements?.length,
			(info: InternalHsAchievementsInfo) =>
				({
					achievements: info.Achievements.map(ach => ({
						id: ach.AchievementId,
						progress: ach.Progress,
						completed: ach.Status === 4,
					})),
				} as HsAchievementsInfo),
			20,
			5000,
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
