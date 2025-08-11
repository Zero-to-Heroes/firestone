import { BnetRegion } from '@firestone-hs/reference-data';
import { GameStatusService } from '@firestone/shared/common/service';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetRegionOperation extends MindVisionOperationFacade<BnetRegion> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getRegion',
			() => mindVision.getRegion(),
			(info) => false,
			(info) => info,
			1,
			1500,
		);
	}
}
