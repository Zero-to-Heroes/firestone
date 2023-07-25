import { BgsQuestStats } from '@firestone-hs/bgs-global-stats';
import { CardIds, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { CardOption } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

export const buildBasicCardChoiceValue = (
	option: CardOption,
	state: GameState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): string => {
	switch (option.source) {
		case CardIds.GuessTheWeight:
			return guessTheWeight(option, state, allCards, i18n);
	}
};

export const buildBgsQuestCardChoiceValue = (
	option: CardOption,
	bgsState: BattlegroundsState,
	bgsQuests: BgsQuestStats,
	allCards: CardsFacadeService,
): {
	questCompletionTurns: number;
	rewardAveragePosition: number;
	rewardTier: string;
	averageTurnsToComplete: number;
	turnsToCompleteForHero: number;
	turnsToCompleteImpact: number;
} => {
	const bgQuestCardId = option.cardId;
	const mainPlayerCardId = bgsState?.currentGame?.getMainPlayer()?.cardId;

	// TODO: handle difficulty, MMR, etc.
	const questStat = bgsQuests.questStats.find((s) => s.questCardId === bgQuestCardId);
	console.debug('questStat', questStat, bgsState?.currentGame?.getMainPlayer());
	if (!questStat) {
		return null;
	}

	const questStatForHero = questStat?.heroStats.find(
		(s) => s.heroCardId === normalizeHeroCardId(mainPlayerCardId, allCards),
	);
	console.debug('statForHero', questStatForHero, mainPlayerCardId, questStat.heroStats);
	const statForDifficulty = questStat?.difficultyStats?.find((s) => s.difficulty === option.questDifficulty);
	const turnsToCompleteImpact = statForDifficulty?.impactTurnToComplete ?? 0;
	console.debug('turnsToCompleteImpact', turnsToCompleteImpact, statForDifficulty);
	const turnsToComplete =
		(questStatForHero == null ? questStat.averageTurnToComplete : questStatForHero.averageTurnToComplete) +
		turnsToCompleteImpact;
	// Because what we count as "turn to complete" is the NUM_TURNS_IN_PLAY, which incremenets at every
	// phase (recruit and combat)
	const turnsLeftToComplete = turnsToComplete == null ? null : turnsToComplete / 2;
	console.debug('turnsLeftToComplete', turnsLeftToComplete, turnsToComplete);

	const rewardStat = bgsQuests.rewardStats.find((r) => r.rewardCardId === option.questReward?.CardId);
	console.debug('rewardStat', rewardStat);
	const rewardStatForHero = rewardStat?.heroStats.find(
		(s) => s.heroCardId === normalizeHeroCardId(mainPlayerCardId, allCards),
	);
	console.debug('rewardStatForHero', rewardStatForHero);

	return turnsLeftToComplete == null
		? null
		: {
				questCompletionTurns: turnsLeftToComplete,
				rewardAveragePosition: rewardStatForHero?.averagePlacement,
				rewardTier: '',
				averageTurnsToComplete: questStat.averageTurnToComplete,
				turnsToCompleteForHero: questStatForHero?.averageTurnToComplete,
				turnsToCompleteImpact: turnsToCompleteImpact,
		  };
};

const guessTheWeight = (
	option: CardOption,
	state: GameState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): string => {
	const lastDrawnCard = state.playerDeck.hand[state.playerDeck.hand.length - 1];
	const costOfLastDrawnCard = lastDrawnCard?.getEffectiveManaCost();
	if (costOfLastDrawnCard == null) {
		return null;
	}

	// Don't show any information if there are some unknowns in the deck
	const hasCardWithoutCostInDeck = state.playerDeck.deck.some((c) => c.getEffectiveManaCost() == null);
	if (hasCardWithoutCostInDeck) {
		return null;
	}

	switch (option.cardId) {
		case CardIds.GuessTheWeight_Less:
			const cardsCostingLess = state.playerDeck.deck.filter(
				(c) => c.getEffectiveManaCost() < costOfLastDrawnCard,
			).length;
			return buildPercents((100 * cardsCostingLess) / state.playerDeck.deck.length);
		case CardIds.GuessTheWeight_More:
			const cardsCostingMore = state.playerDeck.deck.filter(
				(c) => c.getEffectiveManaCost() > costOfLastDrawnCard,
			).length;
			return buildPercents((100 * cardsCostingMore) / state.playerDeck.deck.length);
	}
	return null;
};

const buildPercents = (value: number): string => {
	return value == null ? '-' : value.toFixed(1) + '%';
};
