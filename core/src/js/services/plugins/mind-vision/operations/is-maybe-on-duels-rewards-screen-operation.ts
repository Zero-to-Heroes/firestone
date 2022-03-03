import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class IsMaybeOnDuelsRewardsScreenOperation extends MindVisionOperationFacade<boolean> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'isMaybeOnDuelsRewardsScreenOperation',
			() => mindVision.isMaybeOnDuelsRewardsScreen(),
			(info) => false,
			(info) => info,
			1,
			1500,
		);
	}
}
