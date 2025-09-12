import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class KiljaedenCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'kiljaeden';
	public override image = CardIds.Kiljaeden_GDB_145;
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerKiljaedenCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => {
			const portal = state.playerDeck.enchantments.find(
				(e) => e.cardId === CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e,
			);
			const statsBuff = portal?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2];
			return statsBuff ?? null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.kiljaeden-label', {
					cardName: this.allCards.getCard(CardIds.Kiljaeden_GDB_145).name,
				}),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.kiljaeden-tooltip', {
					cardName: allCards.getCard(CardIds.Kiljaeden_GDB_145).name,
				}),
		},
	};

	readonly opponent = {
		pref: 'opponentKiljaedenCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null =>
			state.opponentDeck.enchantments.find(
				(e) => e.cardId === CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e,
			)?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2] ?? null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.kiljaeden-label', {
					cardName: this.allCards.getCard(CardIds.Kiljaeden_GDB_145).name,
				}),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.kiljaeden-tooltip', {
					cardName: allCards.getCard(CardIds.Kiljaeden_GDB_145).name,
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
		return this.i18n.translateString(`counters.kiljaeden.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
			cardName: this.allCards.getCard(CardIds.Kiljaeden_GDB_145).name,
		});
	}
}
