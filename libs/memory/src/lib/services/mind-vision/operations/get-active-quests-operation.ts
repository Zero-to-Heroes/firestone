import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryQuestsLog } from '../../../models/quests';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetActiveQuestsOperation extends MindVisionOperationFacade<MemoryQuestsLog> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getActiveQuests',
			() => mindVision.getActiveQuests(),
			(info) => false,
			(info) => info,
			3,
			1500,
		);
	}
}
