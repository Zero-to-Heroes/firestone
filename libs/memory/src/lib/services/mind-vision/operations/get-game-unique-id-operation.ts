import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetGameUniqueIdOperation extends MindVisionOperationFacade<string> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getGameUniqueId',
			() => mindVision.getGameUniqueId(),
			(info) => false,
			(info) => info,
			1,
			1500,
		);
	}
}
