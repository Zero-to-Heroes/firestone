import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetDuelsRewardsInfoOperation extends MindVisionOperationFacade<DuelsRewardsInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getDuelsRewardsInfo',
			(forceReset?: boolean) => mindVision.getDuelsRewardsInfo(forceReset),
			rewardsTrackInfo => false,
			rewardsTrackInfo => {
				return {
					...rewardsTrackInfo,
				};
			},
			5,
			1500,
			(info: any) => !info,
		);
	}
}
