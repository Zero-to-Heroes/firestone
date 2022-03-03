import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetDuelsRewardsInfoOperation extends MindVisionOperationFacade<DuelsRewardsInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getDuelsRewardsInfo',
			() => mindVision.getDuelsRewardsInfo(true),
			(rewardsTrackInfo) => false,
			(rewardsTrackInfo) => {
				return {
					...rewardsTrackInfo,
				};
			},
			1, // No retry, because we need to reset the plugin anyway
			1500,
			(info: any) => !info,
		);
	}
}
