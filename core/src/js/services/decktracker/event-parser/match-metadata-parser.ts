import { GameState } from '../../../models/decktracker/game-state';
import { Metadata } from '../../../models/decktracker/metadata';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class MatchMetadataParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MATCH_METADATA;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return Object.assign(new GameState(), currentState, {
			metadata: {
				gameType: gameEvent.additionalData.metaData.GameType as number,
				formatType: gameEvent.additionalData.metaData.FormatType as number,
				scenarioId: gameEvent.additionalData.metaData.ScenarioID as number,
			} as Metadata,
		} as GameState);
	}

	event(): string {
		return DeckEvents.MATCH_METADATA;
	}
}
