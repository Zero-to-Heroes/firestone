import { GameStatusService } from '@firestone/shared/common/service';
import { MemoryPlayerProfileInfo } from '../../../models/memory-profile-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetPlayerProfileInfoOperation extends MindVisionOperationFacade<MemoryPlayerProfileInfo> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getProfileInfo',
			() => mindVision.getPlayerProfileInfo(),
			(info) => false,
			(info) => info,
			1,
			1500,
		);
	}
}
