import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBattlegroundsOwnedHeroSkinDbfIdsOperation extends MindVisionOperationFacade<readonly number[]> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
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
