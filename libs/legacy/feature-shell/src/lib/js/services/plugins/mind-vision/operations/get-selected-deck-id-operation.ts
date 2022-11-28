import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetSelectedDeckIdOperation extends MindVisionOperationFacade<number> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
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
