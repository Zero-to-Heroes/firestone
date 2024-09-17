import { DeckHandlerService, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckParserService } from '../deck-parser.service';
import { DeckstringOverrideEvent } from '../event/deckstring-override-event';
import { DeckstringOverrideParser } from './deckstring-override-parser';
import { EventParser } from './event-parser';

export class WhizbangDeckParser implements EventParser {
	constructor(private readonly deckParser: DeckParserService, private readonly deckHandler: DeckHandlerService) {}

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
			new DeckstringOverrideEvent(templateDeck.name, templateDeck.deckstring, isPlayer ? 'player' : 'opponent'),
		);
		return stateAfterPlayerDeckUpdate;
	}

	event(): string {
		return GameEvent.WHIZBANG_DECK_ID;
	}
}
