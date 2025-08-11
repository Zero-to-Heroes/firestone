import { GameStatusService } from '@firestone/shared/common/service';
import { BattlegroundsInfo } from '../../../models/battlegrounds-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBattlegroundsEndGameOperation extends MindVisionOperationFacade<BattlegroundsInfo> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getBattlegroundsInfoEndGame',
			(forceReset) => mindVision.getBattlegroundsInfo(),
			(battlegroundsInfo) => battlegroundsInfo.Rating == -1 || battlegroundsInfo.NewRating == -1,
			(battlegroundsInfo) => battlegroundsInfo,
			10,
			1500,
		);
	}
}
