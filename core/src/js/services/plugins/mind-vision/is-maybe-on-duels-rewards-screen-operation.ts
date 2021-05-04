import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

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
