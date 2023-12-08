import { OverwolfService } from '@firestone/shared/framework/core';
import { HsAchievementsInfo } from '../../../external-models/achievements-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

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
	readonly Index: number;
	readonly Status: number;
}
