import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetSelectedDeckIdOperation extends MindVisionOperationFacade<number> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getSelectedDeckId',
			(forceReset?: boolean) => mindVision.getSelectedDeckId(forceReset ?? false),
			(deck) => !deck,
			(deck) => deck,
			2,
			2000,
		);
	}
}
