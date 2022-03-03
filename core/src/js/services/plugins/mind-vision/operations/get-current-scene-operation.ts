import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';

export class GetCurrentSceneOperation extends MindVisionOperationFacade<number> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
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
