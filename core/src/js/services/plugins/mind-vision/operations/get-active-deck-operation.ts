import { DeckInfoFromMemory } from '@models/mainwindow/decktracker/deck-info-from-memory';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';

export class GetActiveDeckOperation extends MindVisionOperationFacade<DeckInfoFromMemory> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getActiveDeck',
			(forceReset?: boolean, selectedDeckId?: number) => mindVision.getActiveDeck(selectedDeckId, forceReset),
			(deck) => !deck,
			(deck) => deck,
			5,
			2000,
		);
	}
}
