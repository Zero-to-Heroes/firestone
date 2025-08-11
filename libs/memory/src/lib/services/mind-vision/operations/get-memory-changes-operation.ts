import { GameStatusService } from '@firestone/shared/common/service';
import { MemoryUpdate } from '../../../models/memory-update';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetMemoryChangesOperation extends MindVisionOperationFacade<MemoryUpdate> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getMemoryChanges',
			() => mindVision.getMemoryChanges(),
			(info) => false,
			(info) => info,
			2,
			200,
		);
	}
}
