import { CardClass, CardIds, CardType, GameTag, LIBRAM_IDS, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { broxigarFablePackage, kingLlaneFablePackage } from '../../card-utils';
import { hasRace } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export const modifyDecksForSpecialCards = (
	cardId: string,
	entityId: number,
	isCardCountered: boolean,
	deckState: DeckState,
	opponentDeckState: DeckState,
	allCards: CardsFacadeService,
	helper: DeckManipulationHelper,
	i18n: ILocalizationService,
): [DeckState, DeckState] => {
	deckState = trackFizzle(deckState, cardId, entityId, helper);
	if (!isCardCountered) {
		switch (cardId) {
			case CardIds.RottenRodent:
				return [handleRottenRodent(deckState, allCards, i18n), opponentDeckState];
			case CardIds.AlternateReality_TIME_707:
				return [handleAlternateReality(deckState, allCards, i18n), opponentDeckState];
			case CardIds.CelestialAlignment:
				return [handleCelestialAlignment(deckState, allCards, i18n), opponentDeckState];
			case CardIds.Embiggen:
				return [handleEmbiggen(deckState, allCards, i18n), opponentDeckState];
			case CardIds.DeckOfLunacy:
				return [handleDeckOfLunacy(deckState, allCards, i18n), opponentDeckState];
			case CardIds.TheAzeriteMurlocToken_DEEP_999t5:
				return [handleTheAzeriteMurloc(deckState, allCards, i18n), opponentDeckState];
			case CardIds.FrizzKindleroost:
				return [handleFrizzKindleroost(deckState, allCards, i18n), opponentDeckState];
			case CardIds.TheFiresOfZinAzshari:
				return [handleFiresOfZinAzshari(deckState, allCards, i18n), opponentDeckState];
			case CardIds.IncantersFlow:
				return [handleIncantersFlow(deckState, allCards, i18n), opponentDeckState];
			case CardIds.LorthemarTheron_RLK_593:
				return [handleLorthemarTheron(deckState, allCards, i18n), opponentDeckState];
			case CardIds.LunasPocketGalaxy:
				return [handleLunasPocketGalaxy(deckState, allCards, i18n), opponentDeckState];
			case CardIds.PrinceLiam:
				return [handlePrinceLiam(deckState, allCards, i18n), opponentDeckState];
			case CardIds.AldorAttendant:
			case CardIds.LordaeronAttendantToken:
			case CardIds.InterstellarStarslicer_GDB_726:
			case CardIds.InterstellarWayfarer_GDB_721:
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
			case CardIds.CerathineFleetrunner:
				return [handleCerathineFleetrunner(deckState, allCards, i18n), opponentDeckState];
			case CardIds.LadyPrestor_SW_078:
				return [handleLadyPrestor(deckState, allCards, i18n), opponentDeckState];
			case CardIds.EnvoyOfTheGlade_EDR_873:
				return [handleEnvoyOfTheGlade(deckState, allCards, i18n), opponentDeckState];
			case CardIds.ArchVillainRafaam_CORE_DAL_422:
			case CardIds.ArchVillainRafaam_DAL_422:
			case CardIds.UnearthedRaptor_GoldenMonkeyToken:
				return [handleArchVillainRafaam(deckState, allCards, i18n), opponentDeckState];
			case CardIds.OopsAllSpellsTavernBrawl:
				return [handleOoopsAllSpells(deckState, allCards, i18n), opponentDeckState];
			case CardIds.ScepterOfSummoning:
				return [handleScepterOfSummoning(deckState, allCards, i18n), opponentDeckState];
			case CardIds.SkulkingGeist_CORE_ICC_701:
			case CardIds.SkulkingGeist_ICC_701:
				return [handleSkulkingGeist(deckState, allCards, i18n), opponentDeckState];
			case CardIds.Steamcleaner:
			case CardIds.Steamcleaner_CORE_REV_946:
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
	}
	return [deckState, opponentDeckState];
};

const trackFizzle = (
	deckState: DeckState,
	cardId: string,
	entityId: number,
	helper: DeckManipulationHelper,
): DeckState => {
	const snapshots = deckState.deck.filter((card) => card.cardId === CardIds.PhotographerFizzle_FizzlesSnapshotToken);
	if (!snapshots.length) {
		return deckState;
	}

	let updatedDeck = deckState.deck;
	for (const snapshot of snapshots) {
		if (snapshot.relatedCardIds?.includes(`${entityId}`)) {
			const updatedSnapshot = snapshot.update({
				relatedCardIds: snapshot.relatedCardIds.map((id) => (id === `${entityId}` ? cardId : id)),
			});
			updatedDeck = helper.replaceCardInZone(updatedDeck, updatedSnapshot);
		}
	}
	return deckState.update({
		deck: updatedDeck,
	});
};

// Some cards don't trigger automatically when played
export const modifyDeckForSpecialCardEffects = (
	cardId: string,
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	switch (cardId) {
		case CardIds.VanndarStormpike_AV_223:
			return handleVanndarStormpike(deckState, allCards, i18n);
		case CardIds.Broxigar_TIME_020:
			return handleBroxigar(deckState, allCards, i18n);
		case CardIds.GaronaHalforcen_KingLlaneToken_TIME_875t:
			return handleKingLlane(deckState, allCards, i18n);
		default:
			return deckState;
	}
};

const handleCelestialAlignment = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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

const handleEmbiggen = (deckState: DeckState, allCards: CardsFacadeService, i18n: ILocalizationService): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card) =>
			card.getEffectiveManaCost() <= 10
				? Math.min(10, card.getEffectiveManaCost() + 1)
				: card.getEffectiveManaCost() + 1,
		deckState,
		allCards,
	);
};

const handleRottenRodent = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.mechanics?.includes(GameTag[GameTag.DEATHRATTLE]) ?? false,
		(card) => Math.min(0, card.getEffectiveManaCost() - 1),
		deckState,
		allCards,
	);
};

const handleLibram = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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
	i18n: ILocalizationService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => refCard?.type === 'Spell' || card?.cardType === 'Spell',
		(card) => Math.max(0, card.getEffectiveManaCost() - 1),
		deckState,
		allCards,
	);
};

const handleLorthemarTheron = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	// Works when played, but future C'Thun events don't take the buff into account
	return deckState.update({
		cthunAtk: 2 * deckState.cthunAtk,
		cthunHealth: 2 * deckState.cthunHealth,
	});
};

const handleKingLlane = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	const otherFableCards = kingLlaneFablePackage.filter((c) => c !== CardIds.GaronaHalforcen_KingLlaneToken_TIME_875t);
	if (otherFableCards.some((c) => deckState.hasRelevantCard([c], { includesOtherZone: true, includeBoard: true }))) {
		return deckState;
	}
	const result = deckState.update({
		additionalKnownCardsInDeck: [...(deckState.additionalKnownCardsInDeck || []), ...otherFableCards],
	});
	return result;
};

const handleBroxigar = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	const otherFableCards = broxigarFablePackage.filter((c) => c !== CardIds.Broxigar_TIME_020);
	if (otherFableCards.some((c) => deckState.hasRelevantCard([c], { includesOtherZone: true, includeBoard: true }))) {
		return deckState;
	}
	const result = deckState.update({
		additionalKnownCardsInDeck: [...(deckState.additionalKnownCardsInDeck || []), ...otherFableCards],
	});
	return result;
};

const handleVanndarStormpike = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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
	i18n: ILocalizationService,
): DeckState => {
	return updateCostInDeck(
		(card, refCard) => hasRace(refCard, Race.DRAGON),
		(card) => Math.max(0, card.getEffectiveManaCost() - 2),
		deckState,
		allCards,
	);
};

const handleLunasPocketGalaxy = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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
	i18n: ILocalizationService,
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
	i18n: ILocalizationService,
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
	i18n: ILocalizationService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.playerClass === 'Neutral',
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownCardName(CardClass[deckState.hero?.classes[0] ?? CardClass.NEUTRAL])!,
				creatorCardId: CardIds.WyrmrestPurifier,
				rarity: undefined,
				cardType: undefined,
				refManaCost: undefined,
				actualManaCost: undefined,
				relatedCardIds: undefined,
				cardMatchCondition: (other: ReferenceCard) => other.cost === card.getEffectiveManaCost() + 3,
			} as unknown as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleAlternateReality = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => true,
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownCardName(),
				creatorCardId: CardIds.AlternateReality_TIME_707,
				rarity: undefined,
				cardType: undefined,
				refManaCost: undefined,
				actualManaCost: undefined,
				relatedCardIds: undefined,
			}),
		deckState,
		allCards,
		i18n,
	);
};

const handleCerathineFleetrunner = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownMinionName()!,
				creatorCardId: CardIds.CerathineFleetrunner,
				actualManaCost: undefined,
				rarity: 'unknown',
				cardType: 'Minion',
				relatedCardIds: undefined,
				cardMatchCondition: (other: ReferenceCard) => !other.type || other.type === 'Minion',
			} as unknown as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleExploreUngoro = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	const refCard = allCards.getCard(CardIds.ExploreUngoro_ChooseYourPathToken);
	return updateCardInDeck(
		(card, refCard) => !!refCard,
		(card) =>
			card.update({
				cardId: refCard.id,
				cardName: refCard.name,
				creatorCardId: CardIds.ExploreUngoro,
				refManaCost: refCard.cost,
				rarity: refCard.rarity,
				cardType: refCard.type,
				relatedCardIds: undefined,
			}),
		deckState,
		allCards,
		i18n,
	);
};

const handleDeckOfLunacy = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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
				relatedCardIds: undefined,
				cardMatchCondition: (other: ReferenceCard) =>
					(!other.type || other.type === 'Spell') && other.cost === card.getEffectiveManaCost() + 3,
			} as unknown as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleTheAzeriteMurloc = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) =>
			refCard?.type?.toUpperCase() === CardType[CardType.MINION] ||
			card?.cardType?.toUpperCase() === CardType[CardType.MINION],
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownManaMinionName(Math.min(10, card.getEffectiveManaCost() + 3)),
				creatorCardId: CardIds.TheAzeriteMurlocToken_DEEP_999t5,
				actualManaCost: Math.min(10, card.getEffectiveManaCost() + 3) - 3,
				rarity: 'unknown',
				cardType: 'Minion',
				relatedCardIds: undefined,
				cardMatchCondition: (other: ReferenceCard) =>
					(!other.type || other.type === 'Minion') && other.cost === card.getEffectiveManaCost() + 3,
			} as unknown as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleFiresOfZinAzshari = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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
				relatedCardIds: undefined,
				cardMatchCondition: (other: ReferenceCard) => (other.cost ?? 0) >= 5,
			} as unknown as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleLadyPrestor = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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
				relatedCardIds: undefined,
				cardMatchCondition: (other: ReferenceCard, cardInfos) => {
					const result =
						cardInfos?.cost != null
							? cardInfos.cost === card.getEffectiveManaCost()
							: other.cost === card.getEffectiveManaCost();
					return result;
				},
			} as unknown as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const handleEnvoyOfTheGlade = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.classes?.[0] === CardClass[CardClass.NEUTRAL],
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownRaceName(i18n.translateString('global.class.druid')),
				creatorCardId: CardIds.EnvoyOfTheGlade_EDR_873,
				rarity: 'unknown',
				relatedCardIds: undefined,
				refManaCost: undefined,
				actualManaCost: undefined,
			}),
		deckState,
		allCards,
		i18n,
	);
};

const handleArchVillainRafaam = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => true,
		(card) =>
			card.update({
				cardId: undefined,
				cardName: i18n.getUnknownRaceName(i18n.translateString('global.legendary-minion')),
				creatorCardId: CardIds.ArchVillainRafaam_DAL_422,
				refManaCost: undefined,
				actualManaCost: undefined,
				rarity: 'legendary',
				cardType: 'Minion',
				relatedCardIds: undefined,
			}),
		deckState,
		allCards,
		i18n,
	);
};

const handleHemet = (deckState: DeckState, allCards: CardsFacadeService, i18n: ILocalizationService): DeckState => {
	return updateCardInDeck(
		// We use the initial cost here, see
		// https://www.reddit.com/r/hearthstone/comments/oo8cjr/if_a_cards_costs_are_reduced_during_a_game_does/h5wxgqr/?context=3
		(card, refCard) => (refCard?.cost ?? 0) <= 3,
		(card) => null,
		deckState,
		allCards,
		i18n,
	);
};

const handleOoopsAllSpells = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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
	i18n: ILocalizationService,
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
	i18n: ILocalizationService,
): DeckState => {
	return updateCardInDeck(
		// If the card has an entityId, it will get a CARD_REMOVED_FROM_DECK event
		(card, refCard) => !!card.creatorCardId && !card.entityId,
		(card) => null,
		deckState,
		allCards,
		i18n,
	);
};

const handleDeckOfChaos = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	return updateCardInDeck(
		(card, refCard) => refCard?.type === 'Minion' || card?.cardType === 'Minion',
		(card, refCard) =>
			card.update({
				actualManaCost: refCard?.attack,
			}),
		deckState,
		allCards,
		i18n,
	);
};

const handlePrinceLiam = (
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
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
				refManaCost: undefined,
				actualManaCost: undefined,
				relatedCardIds: undefined,
				cardMatchCondition: (drawnCard: ReferenceCard) => drawnCard.rarity?.toLowerCase() === 'legendary',
			} as unknown as DeckCard),
		deckState,
		allCards,
		i18n,
	);
};

const updateCostInDeck = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard | null) => boolean,
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
		});
	});
	return deckState.update({
		deck: newDeck,
	} as DeckState);
};

const updateCostInHand = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard | null) => boolean,
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
		});
	});
	return deckState.update({
		hand: newHand,
	} as DeckState);
};

const updateCardInDeck = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard | null) => boolean,
	cardUpdater: (card: DeckCard, refCard: ReferenceCard | null) => DeckCard | null,
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	const currentDeck = deckState.deck;
	const newDeck: readonly DeckCard[] = currentDeck
		.map((card) => {
			const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
			if (!cardSelector(card, refCard)) {
				return card;
			}
			const result = cardUpdater(card, refCard);
			return result;
		})
		.filter((card) => card) as readonly DeckCard[];
	return deckState.update({
		deck: newDeck,
	} as DeckState);
};

const updateCardInDeckAndHand = (
	cardSelector: (card: DeckCard, refCard: ReferenceCard | null) => boolean,
	cardUpdater: (card: DeckCard, refCard: ReferenceCard | null) => DeckCard | null,
	deckState: DeckState,
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): DeckState => {
	const newDeck: readonly DeckCard[] = deckState.deck
		.map((card) => {
			const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
			if (!cardSelector(card, refCard)) {
				return card;
			}
			return cardUpdater(card, refCard);
		})
		.filter((card) => card) as readonly DeckCard[];
	const newHand: readonly DeckCard[] = deckState.hand
		.map((card) => {
			const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
			if (!cardSelector(card, refCard)) {
				return card;
			}
			return cardUpdater(card, refCard);
		})
		.filter((card) => card) as readonly DeckCard[];
	return deckState.update({
		deck: newDeck,
		hand: newHand,
	} as DeckState);
};
