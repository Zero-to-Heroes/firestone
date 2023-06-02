import { OverwolfService } from '@firestone/shared/framework/core';
import { HsAchievementCategory } from '@services/achievement/achievements-info';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetAchievementCategoriesOperation extends MindVisionOperationFacade<readonly HsAchievementCategory[]> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getAchievementCategories',
			() => mindVision.getAchievementCategories(),
			(info: readonly InternalHsAchievementsCategory[]) => {
				return !info?.length;
			},
			(info: readonly InternalHsAchievementsCategory[]) => {
				const reuslt = info?.map((cat) => {
					return {
						id: cat.Id,
						name: cat.Name,
						icon: cat.Icon,
						points: cat.Stats.Points,
						availablePoints: cat.Stats.AvailablePoints,
						completedAchievements: cat.Stats.CompletedAchievements,
						totalAchievements: cat.Stats.TotalAchievements,
						completionPercentage:
							cat.Stats.TotalAchievements > 0
								? Math.round((cat.Stats.CompletedAchievements / cat.Stats.TotalAchievements) * 100)
								: 0,
					} as HsAchievementCategory;
				});
				return reuslt;
			},
			1,
			200,
		);
	}
}

export interface InternalHsAchievementsCategory {
	readonly Id: number;
	readonly Name: string;
	readonly Icon: string;
	readonly Stats: InternalHsAchievementsCategoryStats;
}

export interface InternalHsAchievementsCategoryStats {
	readonly AvailablePoints: number;
	readonly Points: number;
	readonly CompletedAchievements: number;
	readonly TotalAchievements: number;
	readonly Unclaimed: number;
}
