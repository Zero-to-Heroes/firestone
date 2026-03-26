import {
	AllCardsService,
	CardClass,
	CardIds,
	GameTag,
	hasMechanic,
	ReferenceCard,
} from '@firestone-hs/reference-data';

import { DeckState } from '../models/deck-state';

const HERALD_SOLDIERS = [
	{ cardClass: CardClass.DEATHKNIGHT, cardId: CardIds.ObsessiveTechnician_SoldierOfOnyxiaToken_CATA_780t },
	{ cardClass: CardClass.DEMONHUNTER, cardId: CardIds.ArmoredBloodletter_SoldierOfAzsharaToken_CATA_525t },
	{ cardClass: CardClass.ROGUE, cardId: CardIds.ManiacalFollower_SoldierOfSinestraToken_CATA_158t },
	{ cardClass: CardClass.SHAMAN, cardId: CardIds.SkywallSentinel_SoldierOfAlakirToken_CATA_565t },
	{ cardClass: CardClass.WARLOCK, cardId: CardIds.ShadowswornDisciple_SoldierOfChogallToken_CATA_725t },
	{ cardClass: CardClass.WARRIOR, cardId: CardIds.CataclysmicWarAxe_SoldierOfRagnarosToken_CATA_580t },
];

export const HERALD_CLASSES = [
	CardClass.DEATHKNIGHT,
	CardClass.DEMONHUNTER,
	CardClass.ROGUE,
	CardClass.SHAMAN,
	CardClass.WARLOCK,
	CardClass.WARRIOR,
];

// The rule is:
// - Herald is limited to Death Knight, Demon Hunter, Rogue, Shaman, Warlock, Warrior, and multi-class cards of those classes.
// - If other classes try to play a Herald card, it will summon a Soldier depending on the class of that card instead
// - Example: A Mage playing  Rite of Twilight into  Fel Infusion will summon a  Soldier of Sinestra and then a  Soldier of Azshara.
// - Example: If a mage manages to generate Envoy of the End or  Ultraxion, they will summon the Soldier of their opponent's class.
export const getHeraldAdditionalCards = (
	refCard: ReferenceCard,
	deckState: DeckState,
	opponentDeckState: DeckState,
): readonly string[] => {
	if (!hasMechanic(refCard, GameTag.HERALD)) {
		return [];
	}

	const currentClassEnum = deckState.getCurrentClassEnum() ?? CardClass.NEUTRAL;
	if (HERALD_CLASSES.includes(currentClassEnum)) {
		// Player is a Herald class - show colossal pieces for their class
		return HERALD_SOLDIERS.filter((s) => s.cardClass === currentClassEnum).map((s) => s.cardId);
	}

	// Player is NOT a Herald class - show Soldier token(s) based on the card's class
	const heraldCardClasses = (refCard.classes ?? []).filter((c) =>
		HERALD_CLASSES.includes(CardClass[c as keyof typeof CardClass]),
	);
	if (heraldCardClasses.length > 0) {
		return heraldCardClasses
			.map((cls) => HERALD_SOLDIERS.find((s) => CardClass[s.cardClass] === cls))
			.filter((s) => !!s)
			.map((s) => s.cardId);
	}

	// Card has no Herald class (neutral/multi-class) - use opponent's class
	const opponentClass = opponentDeckState?.getCurrentClassEnum() ?? CardClass.NEUTRAL;
	const soldier = HERALD_SOLDIERS.find((s) => s.cardClass === opponentClass);
	return soldier ? [soldier.cardId] : [];
};

/**
 * Herald cards and cards that reference the keyword
 * (including the Colossal minions that can be Heralded) cannot be randomly
 * generated unless the player's deck started with one of those cards.
 * Source is on https://hearthstone.wiki.gg/wiki/Herald
 */
export const canIncludeHerald = (
	refCard: ReferenceCard,
	initialDecklist: readonly string[] | undefined,
	currentClass: string | undefined,
	allCards: AllCardsService,
): boolean => {
	if (!isHeraldCard(refCard)) {
		return true;
	}

	if (!initialDecklist?.length) {
		if (!currentClass?.length) {
			return false;
		}
		return HERALD_CLASSES.includes(CardClass[currentClass.toUpperCase()]);
	}

	for (const cardId of initialDecklist) {
		const deckCard = allCards.getCard(cardId);
		if (!deckCard) {
			continue;
		}
		if (isHeraldCard(deckCard)) {
			return true;
		}
	}
	return false;
};

export const isHeraldCard = (card: ReferenceCard): boolean => {
	return (
		!!card.mechanics?.includes(GameTag[GameTag.HERALD]) || !!card.referencedTags?.includes(GameTag[GameTag.HERALD])
	);
};
