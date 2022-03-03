import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';

export class GetSelectedDeckIdOperation extends MindVisionOperationFacade<number> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getSelectedDeckId',
			(forceReset?: boolean) => mindVision.getSelectedDeckId(forceReset),
			(deck) => !deck,
			(deck) => deck,
			2,
			2000,
		);
	}
}
