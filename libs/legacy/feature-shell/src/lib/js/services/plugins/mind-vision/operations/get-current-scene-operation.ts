import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetCurrentSceneOperation extends MindVisionOperationFacade<number> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getCurrentScene',
			() => mindVision.getCurrentScene(),
			(info) => false,
			(info) => +info,
			3,
			1500,
		);
	}
}
