import { OverwolfService } from '@firestone/shared/framework/core';
import { DeckInfoFromMemory } from '@legacy-import/src/lib/js/models/mainwindow/decktracker/deck-info-from-memory';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

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
