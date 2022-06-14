import { ArenaInfo } from '@models/arena-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetArenaInfoOperation extends MindVisionOperationFacade<ArenaInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getArenaInfo',
			() => mindVision.getArenaInfo(),
			(arenaInfo) => arenaInfo.Wins == null || arenaInfo.Wins < 0 || !arenaInfo.HeroCardId,
			(arenaInfo) =>
				Object.assign(new ArenaInfo(), {
					wins: arenaInfo.Wins,
					losses: arenaInfo.Losses,
					heroCardId: arenaInfo.HeroCardId,
				} as ArenaInfo),
		);
	}
}
