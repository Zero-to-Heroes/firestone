import { CardIds, Race } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { formatClass } from '../../hs-utils';

export const modifyDeckForSpecialCards = (
	cardId: string,
	deckState: DeckState,
	allCards: AllCardsService,
): DeckState => {
	switch (cardId) {
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
		case CardIds.Collectible.Warlock.DeckOfChaos:
			return handleDeckOfChaos(deckState, allCards);
		case CardIds.Collectible.Neutral.WyrmrestPurifier:
			return handleWyrmrestPurifier(deckState, allCards);
		case CardIds.Collectible.Neutral.FrizzKindleroost:
			return handleFrizzKindleroost(deckState, allCards);
		case CardIds.Collectible.Neutral.HemetJungleHunter:
			return handleHemet(deckState, allCards);
		default:
			return deckState;
	}
};

const handleEmbiggen = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCost(
		(card, refCard) => refCard.type === 'Minion' || card.cardType === 'Minion',
		card => card.getEffectiveManaCost() + 1,
		deckState,
		allCards,
	);
};

const handleIncantersFlow = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCost(
		(card, refCard) => refCard.type === 'Spell' || card.cardType === 'Spell',
		card => Math.max(0, card.getEffectiveManaCost() - 1),
		deckState,
		allCards,
	);
};

const handleFrizzKindleroost = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCost(
		(card, refCard) => refCard.race === Race.DRAGON.toString(),
		card => Math.max(0, card.getEffectiveManaCost() - 2),
		deckState,
		allCards,
	);
};

const handleLunasPocketGalaxy = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCost(
		(card, refCard) => refCard.type === 'Minion' || card.cardType === 'Minion',
		card => 1,
		deckState,
		allCards,
	);
};

const handleWyrmrestPurifier = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCard(
		(card, refCard) => refCard.playerClass === 'Neutral',
		card =>
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

const handleDeckOfLunacy = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCard(
		(card, refCard) => refCard.type === 'Spell' || card.cardType === 'Spell',
		card =>
			card.update({
				cardId: undefined,
				cardName: `Unknown ${card.getEffectiveManaCost() + 3} mana spell`,
				creatorCardId: CardIds.Collectible.Mage.DeckOfLunacy,
				rarity: 'unknown',
				cardType: 'Spell',
				cardMatchCondition: (other: ReferenceCard) => other.cost === card.getEffectiveManaCost() + 3,
			} as DeckCard),
		deckState,
		allCards,
	);
};

const handleHemet = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCard(
		(card, refCard) => card.getEffectiveManaCost() <= 3,
		card => null,
		deckState,
		allCards,
	);
};

const handleDeckOfChaos = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCard(
		(card, refCard) => refCard.type === 'Minion' || card.cardType === 'Minion',
		(card, refCard) =>
			card.update({
				actualManaCost: refCard.attack,
			} as DeckCard),
		deckState,
		allCards,
	);
};

const handlePrinceLiam = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	return updateCard(
		(card, refCard) => card.getEffectiveManaCost() === 1,
		card =>
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

const updateCost = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard) => boolean,
	costUpdator: (card: DeckCard) => number,
	deckState: DeckState,
	allCards: AllCardsService,
): DeckState => {
	const currentDeck = deckState.deck;
	const newDeck: readonly DeckCard[] = currentDeck.map(card => {
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

const updateCard = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard) => boolean,
	cardUpdater: (card: DeckCard, refCard: ReferenceCard) => DeckCard,
	deckState: DeckState,
	allCards: AllCardsService,
): DeckState => {
	const currentDeck = deckState.deck;
	const newDeck: readonly DeckCard[] = currentDeck
		.map(card => {
			const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
			if (!cardSelector(card, refCard)) {
				return card;
			}
			return cardUpdater(card, refCard);
		})
		.filter(card => card);
	return deckState.update({
		deck: newDeck,
	} as DeckState);
};
