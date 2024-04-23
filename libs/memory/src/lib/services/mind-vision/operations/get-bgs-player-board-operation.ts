import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryBgsTeamInfo } from '../../../models/battlegrounds-player-state';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBgsPlayerBoardOperation extends MindVisionOperationFacade<MemoryBgsTeamInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getBgsPlayerBoard',
			() => mindVision.getBgsPlayerBoard(),
			(info) => false,
			(info) => info,
			5,
			2000,
		);
	}
}
