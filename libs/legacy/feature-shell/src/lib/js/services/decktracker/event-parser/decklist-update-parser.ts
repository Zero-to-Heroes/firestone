import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { DeckSideboard, DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { PreferencesService } from '../../preferences.service';
import { AiDeckService } from '../ai-deck-service.service';
import { DeckHandlerService } from '../deck-handler.service';
import { EventParser } from './event-parser';

export class DecklistUpdateParser implements EventParser {
	constructor(
		private readonly aiDecks: AiDeckService,
		private readonly handler: DeckHandlerService,
		private readonly prefs: PreferencesService,
		private readonly memory: MemoryInspectionService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && state.opponentDeck && gameEvent.type === GameEvent.DECKLIST_UPDATE;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		// For now we don't handle player deck updates
		if (isPlayer) {
			return currentState;
		}
		const shouldLoadDecklist = (await this.prefs.getPreferences()).opponentLoadAiDecklist;
		if (!shouldLoadDecklist) {
			return currentState;
		}
		const deckId = gameEvent.additionalData.deckId;
		const aiDeck = shouldLoadDecklist
			? this.aiDecks.getAiDeck(gameEvent.opponentPlayer.CardID, currentState.metadata.scenarioId)
			: null;
		const newDeckstring = aiDeck && aiDeck.decks && aiDeck.decks[deckId];
		console.log(
			'[decklist-update] loading AI deck',
			gameEvent.opponentPlayer.CardID,
			currentState.metadata.scenarioId,
			deckId,
			newDeckstring,
		);
		if (!newDeckstring) {
			console.log('[decklist-update] could not find new deck');
			return currentState;
		}

		const board = await this.memory.getCurrentBoard();
		const decklist = await this.handler.postProcessDeck(this.handler.buildDeckList(newDeckstring), board);
		const sideboards: readonly DeckSideboard[] = this.handler.buildSideboards(newDeckstring);

		const newPlayerDeck = currentState.opponentDeck.update({
			deckList: shouldLoadDecklist ? decklist : currentState.opponentDeck.deckList,
			sideboards: shouldLoadDecklist ? sideboards : currentState.opponentDeck.sideboards,
			deck: decklist,
		} as DeckState);

		return currentState.update({
			opponentDeck: newPlayerDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.DECKLIST_UPDATE;
	}
}
