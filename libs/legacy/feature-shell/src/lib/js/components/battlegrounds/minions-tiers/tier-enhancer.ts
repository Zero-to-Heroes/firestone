import { CardRules, GameTag, Race } from '@firestone-hs/reference-data';
import { arraysEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { getBoardTypesLock } from './card-rules/board-types';
import { getMechanicsLock } from './card-rules/mechanics';
import { getMenagerieLock } from './card-rules/menagerie';
import { getTavernTier3Lock } from './card-rules/tavern-tier';
import { ExtendedReferenceCard, Tier, TierGroup } from './tiers.model';

export const enhanceTiers = (
	tiers: readonly Tier[],
	playerCardId: string,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): readonly Tier[] => {
	const newTiers = tiers.map((tier) =>
		enhanceTier(tier, playerCardId, boardComposition, tavernLevel, cardRules, allCards, i18n),
	);
	console.debug('[tier-enhancer] enhanced tiers', tiers);
	return newTiers;
};

const enhanceTier = (
	tier: Tier,
	playerCardId: string,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): Tier => {
	const newGroups = tier.groups.map((g) =>
		enhanceGroup(g, playerCardId, boardComposition, tavernLevel, cardRules, allCards, i18n),
	);
	if (newGroups.every((g, index) => g === tier.groups[index])) {
		return tier;
	}

	const newTier: Tier = {
		...tier,
		groups: newGroups,
	};
	return newTier;
};

const enhanceGroup = (
	group: TierGroup,
	playerCardId: string,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): TierGroup => {
	const newCards = group.cards.map((c) =>
		enhanceCard(c, playerCardId, boardComposition, tavernLevel, cardRules, allCards, i18n),
	);
	if (newCards.every((c, index) => c === group.cards[index])) {
		return group;
	}

	const newGroup: TierGroup = {
		...group,
		cards: newCards,
	};
	return newGroup;
};

const enhanceCard = (
	card: ExtendedReferenceCard,
	playerCardId: string,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): ExtendedReferenceCard => {
	const { trinketLocked, trinketLockedReason } = getTrinketLock(
		card,
		playerCardId,
		boardComposition,
		tavernLevel,
		cardRules,
		allCards,
		i18n,
	);
	if (trinketLocked === card.trinketLocked && arraysEqual(trinketLockedReason, card.trinketLockedReason)) {
		return card;
	}

	const newCard: ExtendedReferenceCard = {
		...card,
		trinketLocked,
		trinketLockedReason,
	};
	return newCard;
};

const getTrinketLock = (
	card: ExtendedReferenceCard,
	playerCardId: string,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): { trinketLocked: boolean; trinketLockedReason: readonly string[] } => {
	const rule = cardRules?.[card.id]?.bgsMinionTypesRules;
	if (!rule) {
		return { trinketLocked: false, trinketLockedReason: null };
	}

	let locked = false;
	let lockedReason: string[] = null;
	if (rule.needBoardTypes?.length > 0) {
		const { ruleLock, ruleLockReasons } = getBoardTypesLock(rule, playerCardId, boardComposition, i18n);
		if (ruleLock) {
			locked = true;
			lockedReason = lockedReason ?? [];
			lockedReason.push(...ruleLockReasons);
		}
	}
	if (rule.needMenagerie) {
		const { ruleLock, ruleLockReasons } = getMenagerieLock(boardComposition, i18n);
		if (ruleLock) {
			locked = true;
			lockedReason = lockedReason ?? [];
			lockedReason.push(...ruleLockReasons);
		}
	}
	if (rule.requireTavernTier3) {
		const { ruleLock, ruleLockReasons } = getTavernTier3Lock(tavernLevel, i18n);
		if (ruleLock) {
			locked = true;
			lockedReason = lockedReason ?? [];
			lockedReason.push(...ruleLockReasons);
		}
	}
	if (rule.requireDivineShieldMinions > 0) {
		const { ruleLock, ruleLockReasons } = getMechanicsLock(
			boardComposition,
			GameTag.DIVINE_SHIELD,
			rule.requireDivineShieldMinions,
			allCards,
			i18n,
		);
		if (ruleLock) {
			locked = true;
			lockedReason = lockedReason ?? [];
			lockedReason.push(...ruleLockReasons);
		}
	}
	return { trinketLocked: locked, trinketLockedReason: lockedReason };
};

export interface MinionInfo {
	readonly cardId: string;
	readonly tribes: readonly Race[];
	readonly tavernTier: number;
}
