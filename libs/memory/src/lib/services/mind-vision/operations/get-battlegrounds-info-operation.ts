import { GameStatusService } from '@firestone/shared/common/service';
import { BattlegroundsInfo } from '../../../models/battlegrounds-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBattlegroundsInfoOperation extends MindVisionOperationFacade<BattlegroundsInfo> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getBattlegroundsInfo',
			() => mindVision.getBattlegroundsInfo(),
			(battlegroundsInfo) => battlegroundsInfo.Rating == -1,
			(battlegroundsInfo) => battlegroundsInfo,
			5,
			2000,
		);
	}
}
