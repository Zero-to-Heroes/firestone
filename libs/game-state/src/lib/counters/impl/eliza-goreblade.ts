import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class ElizaGorebladeCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'elizaGoreblade';
	public override image = CardIds.ElizaGoreblade_VAC_426;
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerElizaGorebladeCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => {
			const enchantments = state.playerDeck.enchantments.filter(
				(e) => e.cardId === CardIds.ElizaGoreblade_VitalityShiftEnchantment_VAC_426e,
			);
			const buff = enchantments.map((e) => e.tags?.[GameTag.SPAWN_TIME_COUNT] ?? 0).reduce((a, b) => a + b, 0);
			return buff || null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.eliza-goreblade-label', {
					cardName: this.allCards.getCard(CardIds.ElizaGoreblade_VAC_426).name,
				}),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.eliza-goreblade-tooltip', {
					cardName: allCards.getCard(CardIds.ElizaGoreblade_VAC_426).name,
				}),
		},
	};

	readonly opponent = {
		pref: 'opponentElizaGorebladeCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => {
			const enchantments = state.opponentDeck.enchantments.filter(
				(e) => e.cardId === CardIds.ElizaGoreblade_VitalityShiftEnchantment_VAC_426e,
			);
			const buff = enchantments.map((e) => e.tags?.[GameTag.SPAWN_TIME_COUNT] ?? 0).reduce((a, b) => a + b, 0);
			return buff || null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.eliza-goreblade-label', {
					cardName: this.allCards.getCard(CardIds.ElizaGoreblade_VAC_426).name,
				}),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.eliza-goreblade-tooltip', {
					cardName: allCards.getCard(CardIds.ElizaGoreblade_VAC_426).name,
				}),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.eliza-goreblade.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}
}
