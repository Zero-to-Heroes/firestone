import { DeckInfoFromMemory } from '../../../models/mainwindow/decktracker/deck-info-from-memory';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetWhizbangDeckOperation extends MindVisionOperationFacade<DeckInfoFromMemory> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
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
