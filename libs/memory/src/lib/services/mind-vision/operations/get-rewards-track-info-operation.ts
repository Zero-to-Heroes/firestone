import { GameStatusService } from '@firestone/shared/common/service';
import { RewardsTrackInfos } from '../../../models/rewards-track-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetRewardsTrackInfoOperation extends MindVisionOperationFacade<RewardsTrackInfos> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getRewardsTrackInfo',
			() => mindVision.getRewardsTrackInfo(),
			(rewardsTrackInfo) => false,
			(rewardsTrackInfo) => rewardsTrackInfo,
		);
	}
}
