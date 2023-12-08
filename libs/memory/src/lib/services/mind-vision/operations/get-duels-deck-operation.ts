import { OverwolfService } from '@firestone/shared/framework/core';
import { DuelsDeck } from '../../../models/memory-duels';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetDuelsDeckOperation extends MindVisionOperationFacade<DuelsDeck> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getDuelsDeck',
			(forceReset?: boolean) => mindVision.getDuelsDeck(),
			(info) => false,
			(info) => info,
			1,
			500,
		);
	}
}
