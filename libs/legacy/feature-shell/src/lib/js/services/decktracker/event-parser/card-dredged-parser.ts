import { CardIds, Race } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { hasRace } from '../../hs-utils';
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
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayerBeforeReverse = controllerId === localPlayer.PlayerId;
		const isPlayer = reverseIfNeeded(
			controllerId === localPlayer.PlayerId,
			gameEvent.additionalData.lastInfluencedByCardId,
		);
		// Opponent dredges from your own deck, and supporting this is a nightmare.
		// Moreover, you'll draw the card at the beginning of the next turn, so it's not super important to support
		// this properly
		if (isPlayer && DREDGE_IN_OPPONENT_DECK_CARD_IDS.includes(gameEvent.additionalData.lastInfluencedByCardId)) {
			return currentState;
		}

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
				refManaCost: cardData ? cardData.cost : undefined,
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
					actualManaCost: card.getEffectiveManaCost() - 1,
				});
			case CardIds.HarpoonGun:
				return hasRace(this.allCards.getCard(card.cardId), Race.BEAST)
					? card.update({
							actualManaCost: Math.max(0, card.getEffectiveManaCost() - 3),
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
		return null;
	}
}

export const reverseIfNeeded = (isPlayer: boolean, lastInfluencedByCardId: string): boolean => {
	if (DREDGE_IN_OPPONENT_DECK_CARD_IDS.includes(lastInfluencedByCardId as CardIds)) {
		return !isPlayer;
	}
	return isPlayer;
};

export const DREDGE_IN_OPPONENT_DECK_CARD_IDS = [CardIds.DisarmingElemental, CardIds.FindTheImposter_SpyOMaticToken];
