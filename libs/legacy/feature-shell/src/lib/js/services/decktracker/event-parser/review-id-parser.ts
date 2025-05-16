import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

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
