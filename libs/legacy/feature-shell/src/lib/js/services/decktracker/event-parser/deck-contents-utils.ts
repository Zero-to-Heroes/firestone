import { CardIds, LIBRAM_IDS, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { LocalizationFacadeService } from '../../localization-facade.service';

export const modifyDecksForSpecialCards = (
	cardId: string,
	deckState: DeckState,
	opponentDeckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): [DeckState, DeckState] => {
	switch (cardId) {
		case CardIds.CelestialAlignment:
			return [handleCelestialAlignment(deckState, allCards, i18n), opponentDeckState];
		case CardIds.Embiggen:
			return [handleEmbiggen(deckState, allCards, i18n), opponentDeckState];
		case CardIds.DeckOfLunacy:
			return [handleDeckOfLunacy(deckState, allCards, i18n), opponentDeckState];
		case CardIds.FrizzKindleroost:
			return [handleFrizzKindleroost(deckState, allCards, i18n), opponentDeckState];
		case CardIds.TheFiresOfZinAzshari:
			return [handleFiresOfZinAzshari(deckState, allCards, i18n), opponentDeckState];
		case CardIds.IncantersFlow:
			return [handleIncantersFlow(deckState, allCards, i18n), opponentDeckState];
		case CardIds.LunasPocketGalaxy:
			return [handleLunasPocketGalaxy(deckState, allCards, i18n), opponentDeckState];
		case CardIds.PrinceLiam:
			return [handlePrinceLiam(deckState, allCards, i18n), opponentDeckState];
		case CardIds.AldorAttendant:
		case CardIds.LordaeronAttendantToken:
			return [handleLibram(deckState, allCards, i18n, 1), opponentDeckState];
		case CardIds.AldorTruthseeker:
		case CardIds.RadiantLightspawn:
			return [handleLibram(deckState, allCards, i18n, 2), opponentDeckState];
		case CardIds.DeckOfChaos:
			return [handleDeckOfChaos(deckState, allCards, i18n), opponentDeckState];
		case CardIds.ExploreUngoro:
			return [handleExploreUngoro(deckState, allCards, i18n), opponentDeckState];
		case CardIds.HemetJungleHunter:
			return [handleHemet(deckState, allCards, i18n), opponentDeckState];
		case CardIds.LadyPrestor_SW_078:
			return [handleLadyPrestor(deckState, allCards, i18n), opponentDeckState];
		case CardIds.OopsAllSpellsTavernBrawl:
			return [handleOoopsAllSpells(deckState, allCards, i18n), opponentDeckState];
		case CardIds.ScepterOfSummoning:
			console.log('[passive] will apply scepter of summoning for', deckState.deck.length, deckState.hero?.cardId);
			return [handleScepterOfSummoning(deckState, allCards, i18n), opponentDeckState];
		case CardIds.SkulkingGeist:
			return [handleSkulkingGeist(deckState, allCards, i18n), opponentDeckState];
		case CardIds.Steamcleaner:
			return [
				handleSteamcleaner(deckState, allCards, i18n),
				handleSteamcleaner(opponentDeckState, allCards, i18n),
			];
		case CardIds.UpgradedPackMule:
			return [handleUpgradedPackMule(deckState, allCards, i18n), opponentDeckState];
		case CardIds.WyrmrestPurifier:
			return [handleWyrmrestPurifier(deckState, allCards, i18n), opponentDeckState];
		default:
			return [deckState, opponentDeckState];
	}
};

// Some cards don't trigger automatically when played
export const modifyDeckForSpecialCardEffects = (
	cardId: string,
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	switch (cardId) {
		case CardIds.VanndarStormpike_AV_223:
			return handleVanndarStormpike(deckState, allCards, i18n);
		default:
			return deckState;
	}
};

const handleCelestialAlignment = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
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

const handleEmbiggen = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card) => Math.min(10, card.getEffectiveManaCost() + 1),
		deckState,
		allCards,
	);
};

const handleLibram = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
	costReduction: number,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => LIBRAM_IDS.includes(refCard?.id as CardIds),
		(card) => Math.max(0, card.getEffectiveManaCost() - costReduction),
		deckState,
		allCards,
	);
};

const handleIncantersFlow = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Spell' || card?.cardType === 'Spell',
		(card) => Math.max(0, card.getEffectiveManaCost() - 1),
		deckState,
		allCards,
	);
};

const handleVanndarStormpike = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card) => Math.max(0, card.getEffectiveManaCost() - 3),
		deckState,
		allCards,
	);
};

const handleFrizzKindleroost = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.race === Race[Race.DRAGON] || refCard?.race === Race[Race.ALL],
		(card) => Math.max(0, card.getEffectiveManaCost() - 2),
		deckState,
		allCards,
	);
};

const handleLunasPocketGalaxy = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card) => 1,
		deckState,
		allCards,
	);
};

const handleScepterOfSummoning = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) =>
			(refCard?.type === 'Minion' || card?.cardType === 'Minion') && card?.getEffectiveManaCost() >= 5,
		(card) => 5,
		deckState,
		allCards,
	);
};

const handleUpgradedPackMule = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Spell' || card?.cardType === 'Spell',
		(card) => Math.max(0, card.getEffectiveManaCost() - 1),
		deckState,
		allCards,
	);
};

const handleWyrmrestPurifier = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.playerClass === 'Neutral',
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownCardName(deckState.hero?.playerClass),
				creatorCardId: CardIds.WyrmrestPurifier,
				rarity: undefined,
				cardType: undefined,
				manaCost: undefined,
				actualManaCost: undefined,
				cardMatchCondition: (other: ReferenceCard) => other.cost === card.getEffectiveManaCost() + 3,
			} as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleExploreUngoro = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	const refCard = allCards.getCard(CardIds.ExploreUngoro_ChooseYourPathToken);
	return updateCardInDeck(
		(card, refCard) => !!refCard,
		(card) =>
			card.update({
				cardId: refCard.id,
				cardName: i18n.getCardName(refCard.id, refCard.name),
				creatorCardId: CardIds.ExploreUngoro,
				manaCost: refCard.cost,
				rarity: refCard.rarity,
				cardType: refCard.type,
			} as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleDeckOfLunacy = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.type === 'Spell' || card?.cardType === 'Spell',
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownManaSpellName(Math.min(10, card.getEffectiveManaCost() + 3)),
				creatorCardId: CardIds.DeckOfLunacy,
				actualManaCost: Math.min(10, card.getEffectiveManaCost() + 3) - 3,
				rarity: 'unknown',
				cardType: 'Spell',
				cardMatchCondition: (other: ReferenceCard) => other.cost === card.getEffectiveManaCost() + 3,
			} as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleFiresOfZinAzshari = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => true,
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.translateString('decktracker.unknown-big-minion', { cost: 5 }),
				creatorCardId: CardIds.TheFiresOfZinAzshari,
				actualManaCost: 5,
				rarity: 'unknown',
				cardType: 'Minion',
				cardMatchCondition: (other: ReferenceCard) => other.cost >= 5,
			} as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleLadyPrestor = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.type === 'Minion',
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownRaceName(i18n.translateString('global.tribe.dragon')),
				creatorCardId: CardIds.LadyPrestor_SW_078,
				actualManaCost: card.getEffectiveManaCost(),
				rarity: 'unknown',
				cardType: 'Minion',
				cardMatchCondition: (other: ReferenceCard, cardInfos) => {
					const result =
						cardInfos?.cost != null
							? cardInfos.cost === card.getEffectiveManaCost()
							: other.cost === card.getEffectiveManaCost();
					return result;
				},
			} as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleHemet = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeck(
		// We use the initial cost here, see
		// https://www.reddit.com/r/hearthstone/comments/oo8cjr/if_a_cards_costs_are_reduced_during_a_game_does/h5wxgqr/?context=3
		(card, refCard) => refCard?.cost <= 3,
		(card) => null,
		deckState,
		allCards,
		i18n,
	);
};

const handleOoopsAllSpells = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	const stateWithoutSpells = updateCardInDeck(
		(card, refCard) => refCard?.type === 'Minion',
		(card) => null,
		deckState,
		allCards,
		i18n,
	);
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Spell' || card?.cardType === 'Spell',
		(card) => Math.max(0, card.getEffectiveManaCost() - 1),
		stateWithoutSpells,
		allCards,
	);
};

const handleSkulkingGeist = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeckAndHand(
		// We use the initial cost here, see
		// https://www.reddit.com/r/hearthstone/comments/oo8cjr/if_a_cards_costs_are_reduced_during_a_game_does/h5wxgqr/?context=3
		(card, refCard) => refCard?.cost == 1 && refCard?.type === 'Spell',
		(card) => null,
		deckState,
		allCards,
		i18n,
	);
};

const handleSteamcleaner = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => !!card.creatorCardId,
		(card) => null,
		deckState,
		allCards,
		i18n,
	);
};

const handleDeckOfChaos = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card, refCard) =>
			card.update({
				actualManaCost: refCard?.attack,
			} as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handlePrinceLiam = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => card?.getEffectiveManaCost() === 1,
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownRaceName(i18n.translateString('global.legendary-minion')),
				creatorCardId: CardIds.PrinceLiam,
				rarity: 'legendary',
				cardType: 'Minion',
				manaCost: undefined,
				actualManaCost: undefined,
				cardMatchCondition: (drawnCard: ReferenceCard) => drawnCard.rarity?.toLowerCase() === 'legendary',
			} as DeckCard),
		deckState,
		allCards,
		i18n,
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
	i18n: LocalizationFacadeService,
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
	i18n: LocalizationFacadeService,
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
