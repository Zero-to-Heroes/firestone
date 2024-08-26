import { CardRules, Race } from '@firestone-hs/reference-data';
import { arraysEqual } from '@firestone/shared/framework/common';
import { getBoardTypesLock } from './card-rules/board-types';
import { getMenagerieLock } from './card-rules/menagerie';
import { getTavernTier3Lock } from './card-rules/tavern-tier';
import { ExtendedReferenceCard, Tier, TierGroup } from './tiers.model';

export const enhanceTiers = (
	tiers: readonly Tier[],
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): readonly Tier[] => {
	const newTiers = tiers.map((tier) => enhanceTier(tier, boardComposition, tavernLevel, cardRules, i18n));
	return newTiers;
};

const enhanceTier = (
	tier: Tier,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): Tier => {
	const newGroups = tier.groups.map((g) => enhanceGroup(g, boardComposition, tavernLevel, cardRules, i18n));
	if (newGroups.every((g, index) => g === tier.groups[index])) {
		return tier;
	}

	console.debug('[tier-enhancer] enhanced tier', tier.tavernTier, tier, newGroups);
	const newTier: Tier = {
		...tier,
		groups: newGroups,
	};
	return newTier;
};

const enhanceGroup = (
	group: TierGroup,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): TierGroup => {
	const newCards = group.cards.map((c) => enhanceCard(c, boardComposition, tavernLevel, cardRules, i18n));
	if (newCards.every((c, index) => c === group.cards[index])) {
		return group;
	}

	console.debug('[tier-enhancer] enhanced group', group.label, group, newCards);
	const newGroup: TierGroup = {
		...group,
		cards: newCards,
	};
	return newGroup;
};

const enhanceCard = (
	card: ExtendedReferenceCard,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): ExtendedReferenceCard => {
	const { trinketLocked, trinketLockedReason } = getTrinketLock(card, boardComposition, tavernLevel, cardRules, i18n);
	if (trinketLocked === card.trinketLocked && arraysEqual(trinketLockedReason, card.trinketLockedReason)) {
		return card;
	}

	console.debug('[tier-enhancer] enhanced card', card.id, card, trinketLocked, trinketLockedReason);
	const newCard: ExtendedReferenceCard = {
		...card,
		trinketLocked,
		trinketLockedReason,
	};
	return newCard;
};

const getTrinketLock = (
	card: ExtendedReferenceCard,
	boardComposition: readonly MinionInfo[],
	tavernLevel: number,
	cardRules: CardRules,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): { trinketLocked: boolean; trinketLockedReason: readonly string[] } => {
	const rule = cardRules?.[card.id]?.bgsMinionTypesRules;
	if (!rule) {
		return { trinketLocked: false, trinketLockedReason: null };
	}

	let locked = false;
	let lockedReason: string[] = null;
	if (rule.needBoardTypes?.length > 0) {
		const { ruleLock, ruleLockReasons } = getBoardTypesLock(rule.needBoardTypes, boardComposition, i18n);
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
	return { trinketLocked: locked, trinketLockedReason: lockedReason };
};

export interface MinionInfo {
	readonly tribes: readonly Race[];
	readonly tavernTier: number;
}
