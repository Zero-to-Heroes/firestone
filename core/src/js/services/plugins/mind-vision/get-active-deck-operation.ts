import { DeckInfoFromMemory } from '../../../models/mainwindow/decktracker/deck-info-from-memory';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetActiveDeckOperation extends MindVisionOperationFacade<DeckInfoFromMemory> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getActiveDeck',
			(forceReset?: boolean, selectedDeckId?: number) => mindVision.getActiveDeck(selectedDeckId),
			deck => !deck,
			deck => deck,
			5,
			2000,
		);
	}
}
