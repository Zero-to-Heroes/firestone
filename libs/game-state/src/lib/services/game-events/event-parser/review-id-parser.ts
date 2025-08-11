import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class ReviewIdParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const reviewId = gameEvent.additionalData.reviewId;
		return currentState.update({
			reviewId: reviewId,
		});
	}

	event(): string {
		return GameEvent.REVIEW_ID;
	}
}
