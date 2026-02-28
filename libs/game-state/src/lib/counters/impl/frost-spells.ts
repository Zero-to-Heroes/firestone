import { CardIds, CardType, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class FrostSpellsCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'frostSpells';
	public override image = CardIds.BearonGlashear;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	// Bearon Gla'shear: Battlecry: For each Frost spell you've cast this game, summon a 3/4 Elemental that Freezes.
	public override cards: readonly CardIds[] = [CardIds.BearonGlashear];

	readonly player = {
		pref: 'playerFrostSpellsCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.cardsPlayedThisMatch
				.map((c) => this.allCards.getCard(c.cardId))
				.filter((c: ReferenceCard) => c?.type?.toUpperCase() === CardType[CardType.SPELL])
				.filter((c: ReferenceCard) => c?.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.FROST])
				.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.frost-spells-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.frost-spells-tooltip'),
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
		return this.i18n.translateString(`counters.frost-spells.${side}`, { value: value });
	}
}
