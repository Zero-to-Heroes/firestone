import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { hasOrHadHeroClass } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class CardsDiscardedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'cardsDiscarded';
	public override image = CardIds.DukeOfBelow_CATA_493;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.DukeOfBelow_CATA_493,
		CardIds.BloodQueenLanathel_ICC_841,
		CardIds.BloodQueenLanathel_CORE_ICC_841,
	];

	readonly player = {
		pref: 'playerCardsDiscardedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.otherZone?.filter((c) => c.zone === 'DISCARD').length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-discarded-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-discarded-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentCardsDiscardedCounter' as const,
		display: (state: GameState): boolean => hasOrHadHeroClass(state.opponentDeck?.hero, [CardClass.WARLOCK]),
		value: (state: GameState): number =>
			state.opponentDeck.otherZone?.filter((c) => c.zone === 'DISCARD').length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-discarded-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.cards-discarded-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.cards-discarded.${side}`, { value: value });
	}
}
