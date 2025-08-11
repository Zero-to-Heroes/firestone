import { SceneMode } from '@firestone-hs/reference-data';
import { GameStatusService } from '@firestone/shared/common/service';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetCurrentSceneOperation extends MindVisionOperationFacade<SceneMode> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getCurrentScene',
			() => mindVision.getCurrentScene(),
			(info) => false,
			(info) => +info,
			3,
			1500,
		);
	}
}
