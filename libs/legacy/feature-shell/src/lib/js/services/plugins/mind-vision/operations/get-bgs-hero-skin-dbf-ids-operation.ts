import { SetsService } from '@services/collection/sets-service.service';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetBattlegroundsOwnedHeroSkinDbfIdsOperation extends MindVisionOperationFacade<readonly number[]> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, private allCards: SetsService) {
		super(
			ow,
			'getBattlegroundsOwnedHeroSkinDbfIds',
			() => mindVision.getBattlegroundsOwnedHeroSkinDbfIds(),
			(memoryCollection: any[]) => false,
			(memoryCollection) => memoryCollection,
			10,
			5000,
		);
	}
}
