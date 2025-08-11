import { GameStatusService } from '@firestone/shared/common/service';
import { MemoryBgsPlayerInfo } from '../../../models/battlegrounds-player-state';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBgsPlayerTeammateBoardOperation extends MindVisionOperationFacade<MemoryBgsPlayerInfo> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getBgsPlayerTeammateBoard',
			() => mindVision.getBgsPlayerTeammateBoard(),
			(info) => false,
			(info) => info,
			5,
			2000,
		);
	}
}
