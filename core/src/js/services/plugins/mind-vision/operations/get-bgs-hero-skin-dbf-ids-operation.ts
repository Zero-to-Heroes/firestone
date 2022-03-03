import { SetsService } from '@services/collection/sets-service.service';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';

export class GetBattlegroundsOwnedHeroSkinDbfIdsOperation extends MindVisionOperationFacade<readonly number[]> {
	constructor(mindVision: MindVisionService, ow: OverwolfService, private allCards: SetsService) {
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
