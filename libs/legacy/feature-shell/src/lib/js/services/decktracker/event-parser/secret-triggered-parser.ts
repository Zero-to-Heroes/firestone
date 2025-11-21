import { BoardSecret, DeckCard, GameState, ShortCardWithTurn } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';
import { revealCard } from '../game-state/card-reveal';

export class SecretTriggeredParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newSecrets: readonly BoardSecret[] = deck.secrets
			.filter((secret) => secret.entityId !== entityId)
			.map((secret) => this.helper.removeSecretOptionFromSecret(secret, cardId));
		const secret = this.helper.findCardInZone(deck.otherZone, cardId, entityId);
		const newSecret = secret?.update({
			zone: 'REMOVEDFROMGAME',
			cardId: cardId,
			cardName: this.allCards.getCard(cardId).name,
			refManaCost: this.allCards.getCard(cardId).cost,
			rarity: this.allCards.getCard(cardId).rarity,
		});
		const newOther: readonly DeckCard[] = this.helper.updateCardInZone(deck.otherZone, entityId, cardId, newSecret);

		const secretShortCard: ShortCardWithTurn = {
			cardId: cardId,
			entityId: entityId,
			side: isPlayer ? 'player' : 'opponent',
			turn: +currentState.currentTurn,
		};

		const newPlayerDeck = deck.update({
			secrets: newSecrets,
			otherZone: newOther,
			secretsTriggeredThisMatch: [...deck.secretsTriggeredThisMatch, secretShortCard],
		});

		const playerDeckAfterReveal = isPlayer ? newPlayerDeck : currentState.playerDeck;
		const opponentDeckAfterReveal = isPlayer
			? currentState.opponentDeck
			: revealCard(newPlayerDeck, newSecret, this.allCards);

		return Object.assign(new GameState(), currentState, {
			playerDeck: playerDeckAfterReveal,
			opponentDeck: opponentDeckAfterReveal,
		});
	}

	event(): string {
		return GameEvent.SECRET_TRIGGERED;
	}
}
