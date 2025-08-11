import { GameStatusService } from '@firestone/shared/common/service';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBattlegroundsSelectedModeOperation extends MindVisionOperationFacade<'solo' | 'duos'> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getBattlegroundsSelectedMode',
			() => mindVision.getBattlegroundsSelectedMode(),
			(mode) => mode == null,
			(mode) => mode,
			5,
			2000,
		);
	}
}
