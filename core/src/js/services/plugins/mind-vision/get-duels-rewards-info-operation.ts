import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetDuelsRewardsInfoOperation extends MindVisionOperationFacade<DuelsRewardsInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
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
