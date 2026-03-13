import { CardIds, CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class SpellweaversBrillianceCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'spellweaversBrilliance';
	public override image = CardIds.SpellweaversBrilliance_CATA_452;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.SpellweaversBrilliance_CATA_452];

	readonly player = {
		pref: 'playerSpellweaversBrillianceCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.damageDealtThisTurn
				.filter((d) => {
					const card = this.allCards.getCard(d.sourceCardId);
					return card?.type?.toUpperCase() === CardType[CardType.SPELL];
				})
				.reduce((total, d) => total + d.damage, 0) ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.spellweavers-brilliance-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.spellweavers-brilliance-tooltip'),
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
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.spellweavers-brilliance.${side}`, { value: value });
	}
}
