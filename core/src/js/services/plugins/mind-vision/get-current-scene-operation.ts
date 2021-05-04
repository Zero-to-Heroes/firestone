import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

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
