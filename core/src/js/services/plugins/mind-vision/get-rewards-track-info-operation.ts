import { RewardsTrackInfo } from '../../../models/rewards-track-info';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

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
