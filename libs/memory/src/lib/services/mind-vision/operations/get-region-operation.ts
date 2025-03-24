import { BnetRegion } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetRegionOperation extends MindVisionOperationFacade<BnetRegion> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getRegion',
			() => mindVision.getRegion(),
			(info) => false,
			(info) => info,
			1,
			1500,
		);
	}
}
