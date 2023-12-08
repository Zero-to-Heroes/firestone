import { SceneMode } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetCurrentSceneOperation extends MindVisionOperationFacade<SceneMode> {
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
