import { CardIds } from '@firestone-hs/reference-data';
import { addGuessInfoToCard, DeckCard, GameState, toTagsObject } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import {
	forceHideInfoWhenDrawnInfluencers,
	hiddenWhenDrawFromDeck,
	isCastWhenDrawn,
	publicCardInfos,
	publicTutors,
	supportedAdditionalData,
} from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { tutors } from '../card-info/card-tutors';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const NOT_REAL_DRAW = [CardIds.SirFinleySeaGuide];

export class CardDrawParser implements EventParser {
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
		console.debug('drawing from deck', cardId, gameEvent);
		const isPlayer = controllerId === localPlayer.PlayerId;
		let deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const opponentDeck = isPlayer ? currentState.opponentDeck : currentState.playerDeck;

		let drawnByCardId: string = gameEvent.additionalData.drawnByCardId;

		// If the card is drawn by a public tutor, we don't know anymore what is at the top of the deck
		// so we clear the info to avoid confusion
		// That's also technically true for the bottom, but we can probably leave it like this for now
		if (!isPlayer && publicTutors.includes(drawnByCardId as CardIds)) {
			deck = deck.update({
				deck: deck.deck.map((c) =>
					c.update({
						positionFromTop: undefined,
						// positionFromBottom: undefined,
					}),
				),
			});
		}

		const cardsWithMatchingCardId = deck.deck
			.filter((e) => e.cardId === cardId)
			.filter((e) =>
				!!gameEvent.additionalData.dataTag1 && supportedAdditionalData.includes(e.cardId as CardIds)
					? e.mainAttributeChange - 1 === gameEvent.additionalData.dataTag1
					: true,
			);
		console.debug('cards with matching card id', cardsWithMatchingCardId);
		// So that we don't remove the "card from bottom" when the user doesn't know about it, e.g.
		// if a tutor effect draws the entity ID that is at the bottom and we aren't supposed to know
		// about it. This could change (via a whitelist?) if there are cards that start drawing from
		// the bottom of the deck
		// If no cardId is provided, we use the entityId
		const shouldUseEntityId =
			// Initially, it was !isPlayer, but I don't understand why. If it's the opponent, we don't want to use the entityId
			isPlayer &&
			(!cardId ||
				cardsWithMatchingCardId.length === 1 ||
				cardsWithMatchingCardId.every((e) => e.positionFromBottom == null && e.positionFromTop == null));
		const useTopOfDeckToIdentifyCard = !isPlayer && deck.deck.some((c) => c.positionFromTop != null);
		const cardDrawnFromBottom = [CardIds.SirFinleySeaGuide, CardIds.Fracking_WW_092].includes(
			drawnByCardId as CardIds,
		);
		const useBottomOfDeckToIdentifyCard =
			!isPlayer &&
			cardDrawnFromBottom &&
			deck.deck.some((c) => c.positionFromBottom != null && c.lastAffectedByCardId !== drawnByCardId);
		console.debug(
			'useTopOfDeckToIdentifyCard',
			useTopOfDeckToIdentifyCard,
			useBottomOfDeckToIdentifyCard,
			isPlayer,
			deck.deck.filter((c) => c.positionFromTop != null),
			deck,
		);
		// When drawing "normally", we first try to avoid picking cards that are from the bottom of the deck,
		// if any
		const deckToDrawnFromTop = deck.deck.some((c) => c.positionFromBottom == null)
			? deck.deck.filter((c) => c.positionFromBottom == null)
			: deck.deck;
		let card = useTopOfDeckToIdentifyCard
			? deck.deck.filter((c) => c.positionFromTop != null).sort((c) => c.positionFromTop)[0]
			: useBottomOfDeckToIdentifyCard
				? deck.deck
						.filter((c) => c.positionFromBottom != null)
						// Because Finley puts the cards at the bottom before drawing
						.filter((c) => c.lastAffectedByCardId !== drawnByCardId)
						.sort((c) => c.positionFromBottom)[0]
				: this.helper.findCardInZone(deckToDrawnFromTop, cardId, shouldUseEntityId ? entityId : null, true);
		console.debug(
			'[card-draw] found card in zone',
			card,
			deck,
			cardId,
			entityId,
			useTopOfDeckToIdentifyCard,
			useBottomOfDeckToIdentifyCard,
		);
		if (
			(!card?.entityId || !card?.cardId) &&
			deck.enchantments.some(
				(enchantment) => enchantment.cardId === CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e,
			)
		) {
			card = deck.deck.find((c) => c.entityId === entityId);
			drawnByCardId = CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e;
		}
		const updatedCardId = useTopOfDeckToIdentifyCard ? card.cardId : cardId;

		console.debug(
			'drawing card',
			isPlayer,
			card,
			deck,
			deck.deck.some((c) => c.positionFromTop),
			[...deck.deck].filter((c) => c.positionFromTop != null).sort((c) => c.positionFromTop),
		);

		// This is more and more spaghetti. TODO: clean this up, my future self!
		// This has been introduced because some cards leak info in the logs (tradeable cards traded back to deck)
		// So the C# parser hides some info when emitting the "CARD_DRAW_FROM_DECK" event, but the info isn't removed
		// from the state in the app.
		// So we use this flag to know whether we should display something
		const isDrawnByCardIdPublic = tutors.includes(drawnByCardId as CardIds);
		console.debug('isDrawnByCardIdPublic', isDrawnByCardIdPublic, drawnByCardId);
		const lastInfluencedByCardId = gameEvent.additionalData.lastInfluencedByCardId ?? card.lastAffectedByCardId;

		const isCardDrawnBySecretPassage = forceHideInfoWhenDrawnInfluencers.includes(
			gameEvent.additionalData?.lastInfluencedByCardId,
		);
		const isCardInfoPublic =
			// Also includes a publicCardCreator so that cards drawn from deck when we know what they are (eg
			// Southsea Scoundrel) are flagged
			// Hide the info when card is drawn by Secret Passage? The scenario is:
			// 1. Add a card revealed when drawn to your deck
			// 2. Cast Secret Passage: the card is added to your hand, but the "cast when drawn" effect doesn't trigger
			// (no idea why it behaves like that)
			// 3. As a result, the card info is considered public, and we show it
			isPlayer ||
			useTopOfDeckToIdentifyCard ||
			useBottomOfDeckToIdentifyCard ||
			(!isCardDrawnBySecretPassage && isCastWhenDrawn(updatedCardId, this.allCards)) ||
			(publicCardInfos.includes(lastInfluencedByCardId) &&
				!hiddenWhenDrawFromDeck.includes(lastInfluencedByCardId));
		const isCreatorPublic =
			isCardInfoPublic ||
			// So that we prevent an info leak when a card traded back into the deck is drawn via a tutor
			// ISSUE: there are some cards that are revealed in the deck, like Start of Game effects. In that
			// case, if we draw them via a tutor, they will also be flagged
			// FIX: we remove the "standard tutors" from this check, and they will be only kept for the
			// creator field
			// (!isTradable && publicCardCreators.includes(lastInfluencedByCardId));
			// This field is only used to flag "created by", so we should be fine even with tradeable cards
			(publicCardInfos.includes(lastInfluencedByCardId) &&
				!hiddenWhenDrawFromDeck.includes(lastInfluencedByCardId));
		console.debug('found card in zone', card, deck, updatedCardId, entityId, isCardInfoPublic, isCreatorPublic);

		// When the card should be known (created on top of deck) by we don't know the details (eg Merch Seller, or Dredge),
		// we still want to surface the information we know
		const creatorCardId = gameEvent.additionalData?.creatorCardId;
		const refCard = this.allCards.getCard(card?.cardId);
		const cardWithCreator = card.update({
			entityId: entityId,
			creatorCardId: isCreatorPublic ? (creatorCardId ?? card.creatorCardId) : undefined,
			creatorEntityId: isCreatorPublic ? gameEvent.additionalData.creatorEntityId : undefined,
			cardId: isCardInfoPublic ? card.cardId : undefined,
			cardName: isCardInfoPublic ? (refCard.name ?? card?.cardName) : undefined,
			lastAffectedByCardId: isCreatorPublic
				? (lastInfluencedByCardId ?? card.lastAffectedByCardId ?? drawnByCardId)
				: isDrawnByCardIdPublic
					? drawnByCardId
					: undefined,
			lastAffectedByEntityId: isCreatorPublic
				? (gameEvent.additionalData.drawnByEntityId ?? card.lastAffectedByEntityId)
				: isDrawnByCardIdPublic
					? gameEvent.additionalData.drawnByEntityId
					: undefined,
			refManaCost: isCardInfoPublic ? (card.refManaCost ?? refCard.cost) : null,
			actualManaCost: isCardInfoPublic ? gameEvent.additionalData.cost : null,
			rarity: isCardInfoPublic ? (card.rarity ?? card.rarity) : null,
			zone: 'HAND',
			tags: gameEvent.additionalData.tags ? toTagsObject(gameEvent.additionalData.tags) : card.tags,
		} as DeckCard);
		console.debug('[card-draw] card with creator', cardWithCreator, isPlayer, isCardInfoPublic, card, refCard);
		const cardWithGuessInfo = addGuessInfoToCard(
			cardWithCreator,
			drawnByCardId,
			gameEvent.additionalData.drawnByEntityId,
			deck,
			opponentDeck,
			this.allCards,
		);
		console.debug('[card-draw] cardWithGuessInfo', cardWithGuessInfo, gameEvent);
		const previousDeck = deck.deck;

		// We didn't use the top of deck to identify the card, but we still need to remove the card at the top of the deck
		// This happens when the top card is not identified, eg when the opponent plays Disarming Elemental
		const drawFromTop = !useTopOfDeckToIdentifyCard && previousDeck.filter((c) => c.positionFromTop != null);
		// eslint-disable-next-line prefer-const
		let [newDeck, removedCard] = isCardInfoPublic
			? this.helper.removeSingleCardFromZone(
					previousDeck,
					updatedCardId,
					entityId,
					deck.deckList.length === 0,
					true,
					{
						cost: gameEvent.additionalData.cost,
					},
				)
			: this.helper.removeSingleCardFromZone(previousDeck, null, -1, deck.deckList.length === 0, true);
		console.debug('newDeck 0', newDeck, isCardInfoPublic, previousDeck, removedCard);

		// It can happen that the previous step still removed something (like a filler or created by card)
		if (drawFromTop && !removedCard) {
			const topCard = newDeck.filter((c) => c.positionFromTop != null).sort((c) => c.positionFromTop)[0];
			const isTopCardUnknown = !topCard?.cardId?.length;
			// console.debug('removing top card from deck?', isTopCardUnknown, topCard, newDeck);
			if (!!topCard && isTopCardUnknown) {
				// console.debug('removing top card from deck', topCard, newDeck);
				newDeck = newDeck.filter((c) => c.positionFromTop !== topCard.positionFromTop);
				// console.debug('after removing top card from deck', topCard, newDeck);
			}
		}
		console.debug('newDeck', newDeck, isCardInfoPublic, previousDeck);
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = this.helper.addSingleCardToZone(previousHand, cardWithGuessInfo);
		console.debug('[card-draw] added card to hand', newHand);
		const newPlayerDeck = deck.update({
			deck: newDeck,
			hand: newHand,
			cardDrawnThisGame:
				currentState.currentTurn === 'mulligan' || currentState.currentTurn === 0
					? 0
					: NOT_REAL_DRAW?.includes(drawnByCardId as CardIds)
						? deck.cardDrawnThisGame
						: deck.cardDrawnThisGame + 1,
		});
		console.debug('new player deck', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_DRAW_FROM_DECK;
	}
}
