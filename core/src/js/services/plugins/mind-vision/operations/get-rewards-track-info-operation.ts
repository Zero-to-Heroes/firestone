import { RewardsTrackInfo } from '@models/rewards-track-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetRewardsTrackInfoOperation extends MindVisionOperationFacade<RewardsTrackInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getRewardsTrackInfo',
			() => mindVision.getRewardsTrackInfo(),
			(rewardsTrackInfo) => false,
			(rewardsTrackInfo) => {
				return {
					...rewardsTrackInfo,
				};
			},
		);
	}
}
