import { GameStatusService } from '@firestone/shared/common/service';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetGameUniqueIdOperation extends MindVisionOperationFacade<string> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getGameUniqueId',
			() => mindVision.getGameUniqueId(),
			(info) => false,
			(info) => info,
			1,
			1500,
		);
	}
}
