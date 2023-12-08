import { OverwolfService } from '@firestone/shared/framework/core';
import { DeckInfoFromMemory } from '../../../models/deck-info-from-memory';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetDuelsDeckFromCollectionOperation extends MindVisionOperationFacade<DeckInfoFromMemory> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getDuelsDeck',
			(forceReset?: boolean) => mindVision.getDuelsDeckFromCollection(),
			(info) => false,
			(info) => info,
			1,
			500,
		);
	}
}
