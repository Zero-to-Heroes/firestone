import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBattlegroundsSelectedModeOperation extends MindVisionOperationFacade<'solo' | 'duos'> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getBattlegroundsSelectedMode',
			() => mindVision.getBattlegroundsSelectedMode(),
			(mode) => mode == null,
			(mode) => mode,
			5,
			2000,
		);
	}
}
