import { GameState } from '../../../models/game-state';
import { DeckHandlerService } from '../../deck-handler.service';
import { DeckParserService } from '../../deck/deck-parser.service';
import { DeckstringOverrideEvent } from '../../game-state-events/deckstring-override-event';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckstringOverrideParser } from './deckstring-override-parser';

export class WhizbangDeckParser implements EventParser {
	constructor(
		private readonly deckParser: DeckParserService,
		private readonly deckHandler: DeckHandlerService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const deckId = gameEvent.additionalData.deckId;
		console.log('parsing whizbang deck', deckId, currentState.metadata?.formatType);

		const templateDeck = await this.deckParser.getTemplateDeck(
			deckId,
			currentState.metadata?.scenarioId,
			currentState.metadata?.gameType,
			currentState.metadata?.formatType,
		);
		console.log('got whizbang deck', templateDeck?.name, 'isPlayer', isPlayer);
		console.debug('got whizbang deck', templateDeck);
		if (!templateDeck) {
			return currentState;
		}

		const stateAfterPlayerDeckUpdate = await new DeckstringOverrideParser(this.deckHandler).parse(
			currentState,
			new DeckstringOverrideEvent(templateDeck.name, templateDeck.deckstring!, isPlayer ? 'player' : 'opponent'),
		);
		return stateAfterPlayerDeckUpdate;
	}

	event(): string {
		return GameEvent.WHIZBANG_DECK_ID;
	}
}
