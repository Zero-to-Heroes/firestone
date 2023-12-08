import { OverwolfService } from '@firestone/shared/framework/core';
import { DeckInfoFromMemory } from '../../../models/deck-info-from-memory';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetArenaDeckOperation extends MindVisionOperationFacade<DeckInfoFromMemory> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getArenaDeck',
			() => mindVision.getArenaDeck(),
			(deck: DeckInfoFromMemory) => deck == null,
			(deck: DeckInfoFromMemory) => deck,
		);
	}
}
