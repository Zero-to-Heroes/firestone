import { GameStatusService } from '@firestone/shared/common/service';
import { MemoryQuestsLog } from '../../../models/quests';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetActiveQuestsOperation extends MindVisionOperationFacade<MemoryQuestsLog> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getActiveQuests',
			() => mindVision.getActiveQuests(),
			(info) => false,
			(info) => info,
			3,
			1500,
		);
	}
}
