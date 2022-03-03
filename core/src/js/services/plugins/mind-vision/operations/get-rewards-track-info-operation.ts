import { RewardsTrackInfo } from '@models/rewards-track-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';

export class GetRewardsTrackInfoOperation extends MindVisionOperationFacade<RewardsTrackInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
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
