import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';

export class IsMaybeOnDuelsRewardsScreenOperation extends MindVisionOperationFacade<boolean> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
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
