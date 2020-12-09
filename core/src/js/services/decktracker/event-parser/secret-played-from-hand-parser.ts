import { BoardSecret } from '../../../models/decktracker/board-secret';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { SecretConfigService } from '../secret-config.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretPlayedFromHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly secretConfig: SecretConfigService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.SECRET_PLAYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		const cardWithZone = card.update({
			zone: 'SECRET',
		} as DeckCard);
		const secretClass: string = gameEvent.additionalData.playerClass;
		// console.log('secretClass', secretClass, gameEvent);

		const newHand: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.hand, cardId, entityId)[0];
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToZone(previousOtherZone, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			otherZone: newOtherZone,
			secrets: [
				...deck.secrets,
				BoardSecret.create(
					entityId,
					cardId,
					this.secretConfig.getValidSecrets(currentState.metadata, secretClass),
				),
			] as readonly BoardSecret[],
			cardsPlayedThisTurn: [...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[],
			spellsPlayedThisMatch: deck.spellsPlayedThisMatch + 1,
		} as DeckState);
		// console.log('[secret-turn-end] updated deck after secret played', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.SECRET_PLAYED;
	}
}
