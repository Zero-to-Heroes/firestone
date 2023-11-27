import { OverwolfService } from '@firestone/shared/framework/core';
import { DeckInfoFromMemory } from '@legacy-import/src/lib/js/models/mainwindow/decktracker/deck-info-from-memory';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

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
