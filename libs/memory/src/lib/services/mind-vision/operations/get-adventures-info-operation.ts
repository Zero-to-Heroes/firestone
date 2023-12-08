import { OverwolfService } from '@firestone/shared/framework/core';
import { AdventuresInfo } from '../../../models/memory-duels';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetAdventuresInfoOperation extends MindVisionOperationFacade<AdventuresInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getAdventuresInfo',
			(forceReset?: boolean) => mindVision.getAdventuresInfo(),
			(info) => false,
			(info) => info,
			1,
			500,
		);
	}
}
