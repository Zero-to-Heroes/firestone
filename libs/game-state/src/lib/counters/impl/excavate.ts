/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	CardClass,
	CardIds,
	EXCAVATE_TREASURE_1_IDS,
	EXCAVATE_TREASURE_2_IDS,
	EXCAVATE_TREASURE_3_IDS,
	GameTag,
} from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class ExcavateCounterDefinitionV2 extends CounterDefinitionV2<{
	currentTier: number;
	maxTier: number;
	totalExcavates: number;
	playerClasses: readonly CardClass[];
}> {
	public override id: CounterType = 'excavate';
	public override image = CardIds.KoboldMiner_WW_001;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerExcavateCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.currentExcavateTier > 0 ||
			state.playerDeck?.hasRelevantMechanics(this.allCards, [GameTag.EXCAVATE]),
		value: (state: GameState) => {
			return {
				// It is 0-based in the logs
				currentTier: state.playerDeck.currentExcavateTier,
				maxTier: state.playerDeck.maxExcavateTier + 1,
				playerClasses: state.playerDeck.hero?.classes ?? [],
				totalExcavates: state.playerDeck.totalExcavates,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.excavate-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.excavate-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentExcavateCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.currentExcavateTier > 0 ||
			state.opponentDeck.hasRelevantMechanics(this.allCards, [GameTag.EXCAVATE]),
		value: (state: GameState) => {
			return {
				// It is 0-based in the logs
				currentTier: state.opponentDeck.currentExcavateTier,
				maxTier: state.opponentDeck.maxExcavateTier + 1,
				playerClasses: state.opponentDeck.hero?.classes ?? [],
				totalExcavates: state.opponentDeck.totalExcavates,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.excavate-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.excavate-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(
		value:
			| { currentTier: number; maxTier: number; totalExcavates: number; playerClasses: readonly CardClass[] }
			| null
			| undefined,
	): null | undefined | number | string {
		if (!value) {
			return null;
		}
		const maxTier = value.maxTier;
		return `${value.currentTier}/${maxTier}`;
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
	): readonly string[] | undefined {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const maxTier = deck.maxExcavateTier;
		const nextTier = (deck.currentExcavateTier % maxTier) + 1;
		const nextTierExcavateTreasures = buildExcavateTreasures(nextTier, deck.hero?.classes ?? []);
		return nextTierExcavateTreasures;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState);
		const maxTier = value.maxTier;
		const nextTier = (value.currentTier % maxTier) + 1;
		return this.i18n.translateString(`counters.excavate.${side}`, {
			value: value.currentTier,
			maxTier: maxTier,
			nextTier: nextTier,
			totalExcavates: value.totalExcavates,
		});
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
			return playerClasses.map((playerClass) => getTier4ExcavateTreasure(playerClass)!);
		default:
			return [];
	}
};

const getTier4ExcavateTreasure = (playerClass: CardClass): string | undefined => {
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
		case CardClass.SHAMAN:
			return CardIds.TheAzeriteMurlocToken_DEEP_999t5;
		case CardClass.PALADIN:
			return CardIds.TheAzeriteDragonToken_DEEP_999t4;
		default:
			return undefined;
	}
};
