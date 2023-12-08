import { OverwolfService } from '@firestone/shared/framework/core';
import { RewardsTrackInfos } from '../../../models/rewards-track-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetRewardsTrackInfoOperation extends MindVisionOperationFacade<RewardsTrackInfos> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getRewardsTrackInfo',
			() => mindVision.getRewardsTrackInfo(),
			(rewardsTrackInfo) => false,
			(rewardsTrackInfo) => rewardsTrackInfo,
		);
	}
}
