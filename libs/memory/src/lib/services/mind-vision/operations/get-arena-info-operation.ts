import { OverwolfService } from '@firestone/shared/framework/core';
import { ArenaInfo } from '../../../external-models/arena-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetArenaInfoOperation extends MindVisionOperationFacade<ArenaInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getArenaInfo',
			() => mindVision.getArenaInfo(),
			(arenaInfo) => arenaInfo.Wins == null || arenaInfo.Wins < 0 || !arenaInfo.HeroCardId,
			(arenaInfo) => ({
				wins: arenaInfo.Wins,
				losses: arenaInfo.Losses,
				heroCardId: arenaInfo.HeroCardId,
				runId: arenaInfo.Deck?.Id,
			}),
		);
	}
}
