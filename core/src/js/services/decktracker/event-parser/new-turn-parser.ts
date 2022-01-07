import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { isBattlegrounds } from '../../battlegrounds/bgs-utils';
import { isMercenaries } from '../../mercenaries/mercenaries-utils';
import { OwUtilsService } from '../../plugins/ow-utils.service';
import { PreferencesService } from '../../preferences.service';
import { EventParser } from './event-parser';

export class NewTurnParser implements EventParser {
	constructor(private readonly owUtils: OwUtilsService, private readonly prefs: PreferencesService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.TURN_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const numericTurn = currentState.playerDeck.isFirstPlayer
			? Math.floor(gameEvent.additionalData.turnNumber / 2)
			: Math.floor((gameEvent.additionalData.turnNumber + 1) / 2);
		// const numericTurn = Math.floor((gameEvent.additionalData.turnNumber + 1) / 2);
		const currentTurn = currentState.mulliganOver ? numericTurn : 'mulligan';
		const isPlayerActive = currentState.playerDeck.isFirstPlayer
			? gameEvent.additionalData.turnNumber % 2 === 1
			: gameEvent.additionalData.turnNumber % 2 === 0;
		if (
			isPlayerActive &&
			!isBattlegrounds(currentState.metadata.gameType) &&
			!isMercenaries(currentState.metadata.gameType)
		) {
			const prefs = await this.prefs.getPreferences();
			if (prefs.flashWindowOnYourTurn) {
				this.owUtils.flashWindow();
			}
		}
		const playerDeck = currentState.playerDeck.update({
			isActivePlayer: isPlayerActive,
			cardsPlayedThisTurn: [] as readonly DeckCard[],
			damageTakenThisTurn: 0,
			elementalsPlayedLastTurn: isPlayerActive
				? currentState.playerDeck.elementalsPlayedLastTurn
				: currentState.playerDeck.elementalsPlayedThisTurn,
			elementalsPlayedThisTurn: 0,
		} as DeckState);
		const opponentDeck = currentState.opponentDeck.update({
			isActivePlayer: !isPlayerActive,
			cardsPlayedThisTurn: [] as readonly DeckCard[],
			damageTakenThisTurn: 0,
			elementalsPlayedLastTurn: !isPlayerActive
				? currentState.opponentDeck.elementalsPlayedLastTurn
				: currentState.opponentDeck.elementalsPlayedThisTurn,
			elementalsPlayedThisTurn: 0,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			currentTurn: currentTurn,
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.TURN_START;
	}
}
