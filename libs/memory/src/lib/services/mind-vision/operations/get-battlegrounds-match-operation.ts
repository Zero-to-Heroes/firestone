import { OverwolfService } from '@firestone/shared/framework/core';
import { BattlegroundsInfo } from '../../../models/battlegrounds-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBattlegroundsMatchOperation extends MindVisionOperationFacade<BattlegroundsInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getBattlegroundsMatchWithPlayers',
			(forceReset?: boolean) => mindVision.getBattlegroundsInfo(forceReset),
			(battlegroundsInfo) => false,
			(battlegroundsInfo) => battlegroundsInfo,
			2,
			1000,
			// (battlegroundsInfo) => !battlegroundsInfo?.Game?.Players || battlegroundsInfo.Game.Players.length === 0,
			(battlegroundsInfo) => false, //!battlegroundsInfo?.Game?.Players || battlegroundsInfo.Game.Players.length === 0,
		);
	}
}
