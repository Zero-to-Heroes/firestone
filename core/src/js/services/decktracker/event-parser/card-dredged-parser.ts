import { CardIds, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardDredgedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_DREDGED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// console.debug('[debug] card dredged', cardId, controllerId, localPlayer, entityId, gameEvent, currentState);

		const isPlayer = reverseIfNeeded(
			controllerId === localPlayer.PlayerId,
			gameEvent.additionalData.lastInfluencedByCardId,
		);
		// Because of the way the info is in the logs, when we dredge for our opponent, the card itself
		// is flagged as belonging to the player who dredged
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const cardData = cardId?.length ? this.allCards.getCard(cardId) : null;
		const card = (
			this.helper.findCardInZone(deck.deck, cardId, entityId) ??
			DeckCard.create({
				cardId: cardId,
				entityId: entityId,
				cardName: this.buildCardName(cardData, gameEvent.additionalData.creatorCardId),
				manaCost: cardData ? cardData.cost : undefined,
				rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : undefined,
				creatorCardId: gameEvent.additionalData.creatorCardId,
			} as DeckCard)
		).update({
			positionFromTop: 0,
			positionFromBottom: undefined,
			dredged: true,
			linkedEntityIds: deck.deck
				.filter((c) => c.positionFromBottom)
				.sort((a, b) => a.positionFromBottom - b.positionFromBottom)
				.slice(0, 3)
				.map((c) => c.entityId),
		});
		// console.debug('[debug]', 'dredged card', entityId, cardId, card);
		const cardAfterDredgeEffect = this.applyDredgerEffect(card);
		DeckCard.deckIndexFromBottom += 4;

		const newDeck: readonly DeckCard[] = this.helper.empiricReplaceCardInZone(
			deck.deck,
			cardAfterDredgeEffect,
			deck.deckList.length === 0,
		);
		const newPlayerDeck = deck.update({
			deck: newDeck,
		});
		// console.debug('[debug]', 'newPlayerDeck', newPlayerDeck, deck.deck);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_DREDGED;
	}

	private applyDredgerEffect(card: DeckCard): DeckCard {
		const dredgerCardId = card.lastAffectedByCardId;
		switch (dredgerCardId) {
			case CardIds.ExcavationSpecialist_TSC_911:
			case CardIds.ExcavationSpecialist_Story_11_ExcavationPuzzle:
				return card.update({
					actualManaCost: card.manaCost - 1,
				});
			case CardIds.HarpoonGun:
				return this.allCards.getCard(card.cardId).race === Race[Race.BEAST]
					? card.update({
							actualManaCost: Math.max(0, card.manaCost - 3),
					  })
					: card;
		}
		return card;
	}

	private buildCardName(card: any, creatorCardId: string): string {
		if (card) {
			return this.i18n.getCardName(card.id);
		}
		if (creatorCardId) {
			return this.i18n.getCreatedByCardName(creatorCardId);
		}
		return this.i18n.getUnknownCardName();
	}
}

export const reverseIfNeeded = (isPlayer: boolean, lastInfluencedByCardId: string): boolean => {
	switch (lastInfluencedByCardId) {
		case CardIds.DisarmingElemental:
			return !isPlayer;
		default:
			return isPlayer;
	}
};
