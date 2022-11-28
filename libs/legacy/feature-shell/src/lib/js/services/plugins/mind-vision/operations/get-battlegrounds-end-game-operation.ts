import { BattlegroundsInfo } from '@models/battlegrounds-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetBattlegroundsEndGameOperation extends MindVisionOperationFacade<BattlegroundsInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getBattlegroundsInfoEndGame',
			(forceReset) => mindVision.getBattlegroundsInfo(),
			(battlegroundsInfo) => battlegroundsInfo.Rating == -1 || battlegroundsInfo.NewRating == -1,
			(battlegroundsInfo) => ({
				Rating: battlegroundsInfo.Rating,
				NewRating: battlegroundsInfo.NewRating,
				Game: battlegroundsInfo.Game,
			}),
			50,
			150,
		);
	}
}
