import { GameStatusService } from '@firestone/shared/common/service';
import { DeckInfoFromMemory } from '../../../models/deck-info-from-memory';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetWhizbangDeckOperation extends MindVisionOperationFacade<DeckInfoFromMemory> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getWhizbangDeck',
			(forceReset?: boolean, deckId?: number) => mindVision.getWhizbangDeck(deckId),
			(deck) => !deck,
			(deck) => deck,
			5,
			2000,
		);
	}
}
