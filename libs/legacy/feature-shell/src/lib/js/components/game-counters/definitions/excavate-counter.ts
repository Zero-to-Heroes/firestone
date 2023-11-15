import {
	CardClass,
	CardIds,
	EXCAVATE_TREASURE_1_IDS,
	EXCAVATE_TREASURE_2_IDS,
	EXCAVATE_TREASURE_3_IDS,
} from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ExcavateCounterDefinition
	implements
		CounterDefinition<GameState, { currentTier: number; maxTier: number; playerClasses: readonly CardClass[] }>
{
	readonly type = 'excavate';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): ExcavateCounterDefinition {
		return new ExcavateCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): { currentTier: number; maxTier: number; playerClasses: readonly CardClass[] } {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			// It is 0-based in the logs
			currentTier: deck.currentExcavateTier + 1,
			maxTier: deck.maxExcavateTier + 1,
			playerClasses: deck.hero?.classes,
		};
	}

	public emit(excavate: {
		currentTier: number;
		maxTier: number;
		playerClasses: readonly CardClass[];
	}): NonFunctionProperties<ExcavateCounterDefinition> {
		const maxTier = excavate.maxTier;
		const nextTier = (excavate.currentTier % maxTier) + 1;
		const tooltip = this.i18n.translateString(`counters.excavate.${this.side}`, {
			value: excavate.currentTier,
			maxTier: maxTier,
		});
		const nextTierExcavateTreasures = buildExcavateTreasures(excavate.currentTier, excavate.playerClasses);
		console.debug('showing excavate counter', nextTier, excavate, nextTierExcavateTreasures, nextTier);
		return {
			type: 'excavate',
			value: `${excavate.currentTier}/${maxTier}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.KoboldMiner_WW_001}.jpg`,
			cssClass: 'excavate-counter',
			tooltip: tooltip,
			cardTooltips: nextTierExcavateTreasures,
			standardCounter: true,
		};
	}
}

const buildExcavateTreasures = (tier: number, playerClasses: readonly CardClass[]): readonly string[] => {
	switch (tier) {
		case 1:
			return EXCAVATE_TREASURE_1_IDS;
		case 2:
			return EXCAVATE_TREASURE_2_IDS;
		case 3:
			return EXCAVATE_TREASURE_3_IDS;
		case 4:
			return playerClasses.map((playerClass) => getTier4ExcavateTreasure(playerClass));
	}
};

const getTier4ExcavateTreasure = (playerClass: CardClass): string => {
	switch (playerClass) {
		case CardClass.DEATHKNIGHT:
			return CardIds.KoboldMiner_TheAzeriteRatToken_WW_001t26;
		case CardClass.MAGE:
			return CardIds.KoboldMiner_TheAzeriteHawkToken_WW_001t24;
		case CardClass.ROGUE:
			return CardIds.KoboldMiner_TheAzeriteScorpionToken_WW_001t23;
		case CardClass.WARLOCK:
			return CardIds.KoboldMiner_TheAzeriteSnakeToken_WW_001t25;
		case CardClass.WARRIOR:
			return CardIds.KoboldMiner_TheAzeriteOxToken_WW_001t27;
	}
};
