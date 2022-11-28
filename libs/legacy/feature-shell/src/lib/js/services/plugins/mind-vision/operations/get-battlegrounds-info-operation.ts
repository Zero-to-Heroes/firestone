import { BattlegroundsInfo } from '@models/battlegrounds-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetBattlegroundsInfoOperation extends MindVisionOperationFacade<BattlegroundsInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getBattlegroundsInfo',
			() => mindVision.getBattlegroundsInfo(),
			(battlegroundsInfo) => battlegroundsInfo.Rating == -1,
			(battlegroundsInfo) => ({
				Rating: battlegroundsInfo.Rating,
				Game: battlegroundsInfo.Game,
			}),
			5,
			2000,
		);
	}
}
