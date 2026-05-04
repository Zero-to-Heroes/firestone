import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class ShirvallahCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'shirvallah';
	public override image = CardIds.ShirvallahTheTiger;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	// Shirvallah, the Tiger: Divine Shield, Rush, Lifesteal. Costs (1) less for each Mana you've spent on spells.
	public override cards: readonly CardIds[] = [CardIds.ShirvallahTheTiger];

	readonly player = {
		pref: 'playerShirvallahCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck.manaSpentOnSpellsThisMatch ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.shirvallah-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.shirvallah-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const manaSpent = this[side]?.value(gameState) ?? 0;
		const baseCost = this.allCards.getCard(CardIds.ShirvallahTheTiger).cost!;
		const currentCost = Math.max(0, baseCost - manaSpent);
		return this.i18n.translateString(`counters.shirvallah.${side}`, {
			value: manaSpent,
			cost: currentCost,
		});
	}
}
