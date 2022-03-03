import { DeckInfoFromMemory } from '@models/mainwindow/decktracker/deck-info-from-memory';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetWhizbangDeckOperation extends MindVisionOperationFacade<DeckInfoFromMemory> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getWhizbangDeck',
			(forceReset?: boolean, deckId?: number) => mindVision.getWhizbangDeck(deckId),
			(deck) => !deck,
			(deck) => deck,
			5,
			2000,
		);
	}
}
