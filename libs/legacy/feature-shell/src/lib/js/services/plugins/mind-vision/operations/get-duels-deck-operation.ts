import { DuelsDeck } from '@models/memory/memory-duels';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

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
