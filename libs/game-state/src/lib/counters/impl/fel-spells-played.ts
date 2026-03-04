import { CardIds, CardType, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class FelSpellsPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'felSpells';
	public override image = CardIds.RavenousFelfisher_CATA_529;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.RavenousFelfisher_CATA_529];

	readonly player = {
		pref: 'playerFelSpellCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.cardsPlayedThisMatch
				.map((c) => this.allCards.getCard(c.cardId))
				.filter((c: ReferenceCard) => c?.type?.toUpperCase() === CardType[CardType.SPELL])
				.filter((c: ReferenceCard) => c?.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.FEL])
				.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.fel-spells-played-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.fel-spells-played-tooltip'),
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
		return this.i18n.translateString(`counters.fel-spells.${side}`, { value: value });
	}
}
