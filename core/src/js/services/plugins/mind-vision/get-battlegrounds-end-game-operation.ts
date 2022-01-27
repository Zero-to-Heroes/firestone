import { BattlegroundsInfo } from '../../../models/battlegrounds-info';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetBattlegroundsEndGameOperation extends MindVisionOperationFacade<BattlegroundsInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
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
