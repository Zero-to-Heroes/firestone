import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { formatClass } from '../../hs-utils';

export const modifyDeckForSpecialCards = (
	cardId: string,
	deckState: DeckState,
	allCards: CardsFacadeService,
): DeckState => {
	switch (cardId) {
		case CardIds.Collectible.Druid.CelestialAlignment:
			return handleCelestialAlignment(deckState, allCards);
		case CardIds.Collectible.Druid.Embiggen:
			return handleEmbiggen(deckState, allCards);
		case CardIds.Collectible.Mage.DeckOfLunacy:
			return handleDeckOfLunacy(deckState, allCards);
		case CardIds.Collectible.Mage.IncantersFlow:
			return handleIncantersFlow(deckState, allCards);
		case CardIds.Collectible.Mage.LunasPocketGalaxy:
			return handleLunasPocketGalaxy(deckState, allCards);
		case CardIds.Collectible.Paladin.PrinceLiam:
			return handlePrinceLiam(deckState, allCards);
		case CardIds.Collectible.Paladin.AldorAttendant:
		case CardIds.NonCollectible.Paladin.LordaeronAttendantToken:
			return handleLibram(deckState, allCards, 1);
		case CardIds.Collectible.Paladin.AldorTruthseeker:
		case CardIds.NonCollectible.Paladin.RadiantLightspawn:
			return handleLibram(deckState, allCards, 2);
		case CardIds.Collectible.Warlock.DeckOfChaos:
			return handleDeckOfChaos(deckState, allCards);
		case CardIds.Collectible.Neutral.WyrmrestPurifier:
			return handleWyrmrestPurifier(deckState, allCards);
		case CardIds.Collectible.Neutral.FrizzKindleroost:
			return handleFrizzKindleroost(deckState, allCards);
		case CardIds.Collectible.Neutral.HemetJungleHunter:
			return handleHemet(deckState, allCards);
		case CardIds.Collectible.Neutral.LadyPrestor:
			return handleLadyPrestor(deckState, allCards);
		case CardIds.Collectible.Neutral.SkulkingGeist:
			return handleSkulkingGeist(deckState, allCards);
		case CardIds.NonCollectible.Neutral.ScepterOfSummoning:
			return handleScepterOfSummoning(deckState, allCards);
		case CardIds.Collectible.Warrior.ExploreUngoro:
			return handleExploreUngoro(deckState, allCards);
		default:
			return deckState;
	}
};

const handleCelestialAlignment = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	const withDeck = updateCostInDeck(
		(card, refCard) => true,
		(card) => 1,
		deckState,
		allCards,
	);
	return updateCostInHand(
		(card, refCard) => true,
		(card) => 1,
		withDeck,
		allCards,
	);
};

const handleEmbiggen = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card) => Math.min(10, card.getEffectiveManaCost() + 1),
		deckState,
		allCards,
	);
};

const handleLibram = (deckState: DeckState, allCards: CardsFacadeService, costReduction: number): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.name?.includes('Libram of'),
		(card) => Math.max(0, card.getEffectiveManaCost() - costReduction),
		deckState,
		allCards,
	);
};

const handleIncantersFlow = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Spell' || card?.cardType === 'Spell',
		(card) => Math.max(0, card.getEffectiveManaCost() - 1),
		deckState,
		allCards,
	);
};

const handleFrizzKindleroost = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.race === Race.DRAGON.toString(),
		(card) => Math.max(0, card.getEffectiveManaCost() - 2),
		deckState,
		allCards,
	);
};

const handleLunasPocketGalaxy = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card) => 1,
		deckState,
		allCards,
	);
};

const handleScepterOfSummoning = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCostInDeck(
		(card, refCard) => (refCard?.type === 'Minion' || card?.cardType === 'Minion') && card?.actualManaCost >= 5,
		(card) => 5,
		deckState,
		allCards,
	);
};

const handleWyrmrestPurifier = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.playerClass === 'Neutral',
		(card) =>
			card.update({
				cardId: undefined,
				cardName: `Unknown ${formatClass(deckState.hero?.playerClass)} card`,
				creatorCardId: CardIds.Collectible.Neutral.WyrmrestPurifier,
				rarity: undefined,
				cardType: undefined,
				manaCost: undefined,
				actualManaCost: undefined,
				cardMatchCondition: (other: ReferenceCard) => other.cost === card.getEffectiveManaCost() + 3,
			} as DeckCard),
		deckState,
		allCards,
	);
};

const handleExploreUngoro = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	const refCard = allCards.getCard(CardIds.NonCollectible.Warrior.ExploreUngoro_ChooseYourPathToken);
	return updateCardInDeck(
		(card, refCard) => true,
		(card) =>
			card.update({
				cardId: refCard.id,
				cardName: refCard.name,
				creatorCardId: CardIds.Collectible.Warrior.ExploreUngoro,
				manaCost: refCard.cost,
				rarity: refCard.rarity,
				cardType: refCard.type,
			} as DeckCard),
		deckState,
		allCards,
	);
};

const handleDeckOfLunacy = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.type === 'Spell' || card?.cardType === 'Spell',
		(card) =>
			card.update({
				cardId: undefined,
				cardName: `Unknown ${Math.min(10, card.getEffectiveManaCost() + 3)} mana spell`,
				creatorCardId: CardIds.Collectible.Mage.DeckOfLunacy,
				actualManaCost: Math.min(10, card.getEffectiveManaCost() + 3) - 3,
				rarity: 'unknown',
				cardType: 'Spell',
				cardMatchCondition: (other: ReferenceCard) => other.cost === card.getEffectiveManaCost() + 3,
			} as DeckCard),
		deckState,
		allCards,
	);
};

const handleLadyPrestor = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.type === 'Minion',
		(card) =>
			card.update({
				cardId: undefined,
				cardName: `Unknown Dragon`,
				creatorCardId: CardIds.Collectible.Neutral.LadyPrestor,
				actualManaCost: card.getEffectiveManaCost(),
				rarity: 'unknown',
				cardType: 'Minion',
				cardMatchCondition: (other: ReferenceCard) => other.cost === card.getEffectiveManaCost(),
			} as DeckCard),
		deckState,
		allCards,
	);
};

const handleHemet = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCardInDeck(
		// We use the initial cost here, see
		// https://www.reddit.com/r/hearthstone/comments/oo8cjr/if_a_cards_costs_are_reduced_during_a_game_does/h5wxgqr/?context=3
		(card, refCard) => refCard.cost <= 3,
		(card) => null,
		deckState,
		allCards,
	);
};

const handleSkulkingGeist = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCardInDeckAndHand(
		// We use the initial cost here, see
		// https://www.reddit.com/r/hearthstone/comments/oo8cjr/if_a_cards_costs_are_reduced_during_a_game_does/h5wxgqr/?context=3
		(card, refCard) => refCard.cost == 1,
		(card) => null,
		deckState,
		allCards,
	);
};

const handleDeckOfChaos = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card, refCard) =>
			card.update({
				actualManaCost: refCard?.attack,
			} as DeckCard),
		deckState,
		allCards,
	);
};

const handlePrinceLiam = (deckState: DeckState, allCards: CardsFacadeService): DeckState => {
	return updateCardInDeck(
		(card, refCard) => card?.getEffectiveManaCost() === 1,
		(card) =>
			card.update({
				cardId: undefined,
				cardName: `Unknown Legendary Minion`,
				creatorCardId: CardIds.Collectible.Paladin.PrinceLiam,
				rarity: 'legendary',
				cardType: 'Minion',
				manaCost: undefined,
				actualManaCost: undefined,
				cardMatchCondition: (drawnCard: ReferenceCard) => drawnCard.rarity?.toLowerCase() === 'legendary',
			} as DeckCard),
		deckState,
		allCards,
	);
};

const updateCostInDeck = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard) => boolean,
	costUpdator: (card: DeckCard) => number,
	deckState: DeckState,
	allCards: CardsFacadeService,
): DeckState => {
	const currentDeck = deckState.deck;
	const newDeck: readonly DeckCard[] = currentDeck.map((card) => {
		const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
		if (!cardSelector(card, refCard)) {
			return card;
		}
		return card.update({
			actualManaCost: costUpdator(card),
		} as DeckCard);
	});
	return deckState.update({
		deck: newDeck,
	} as DeckState);
};

const updateCostInHand = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard) => boolean,
	costUpdator: (card: DeckCard) => number,
	deckState: DeckState,
	allCards: CardsFacadeService,
): DeckState => {
	const currentHand = deckState.hand;
	const newHand: readonly DeckCard[] = currentHand.map((card) => {
		const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
		if (!cardSelector(card, refCard)) {
			return card;
		}
		return card.update({
			actualManaCost: costUpdator(card),
		} as DeckCard);
	});
	return deckState.update({
		hand: newHand,
	} as DeckState);
};

const updateCardInDeck = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard) => boolean,
	cardUpdater: (card: DeckCard, refCard: ReferenceCard) => DeckCard,
	deckState: DeckState,
	allCards: CardsFacadeService,
): DeckState => {
	const currentDeck = deckState.deck;
	const newDeck: readonly DeckCard[] = currentDeck
		.map((card) => {
			const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
			if (!cardSelector(card, refCard)) {
				return card;
			}
			return cardUpdater(card, refCard);
		})
		.filter((card) => card);
	return deckState.update({
		deck: newDeck,
	} as DeckState);
};

const updateCardInDeckAndHand = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard) => boolean,
	cardUpdater: (card: DeckCard, refCard: ReferenceCard) => DeckCard,
	deckState: DeckState,
	allCards: CardsFacadeService,
): DeckState => {
	const newDeck: readonly DeckCard[] = deckState.deck
		.map((card) => {
			const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
			if (!cardSelector(card, refCard)) {
				return card;
			}
			return cardUpdater(card, refCard);
		})
		.filter((card) => card);
	const newHand: readonly DeckCard[] = deckState.hand
		.map((card) => {
			const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
			if (!cardSelector(card, refCard)) {
				return card;
			}
			return cardUpdater(card, refCard);
		})
		.filter((card) => card);
	return deckState.update({
		deck: newDeck,
		hand: newHand,
	} as DeckState);
};
