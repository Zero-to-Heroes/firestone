import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { getCost } from '../../services/card-utils';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class JadeGuardiansCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'jadeGuardians';
	public override image = CardIds.JadeGuardians_JAIL_474;
	public override cards: readonly CardIds[] = [CardIds.JadeGuardians_JAIL_474];

	readonly player = {
		pref: 'playerJadeGuardiansCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null =>
			state.playerDeck?.cardsPlayedThisMatch
				.map((c) => state.playerDeck.findCard(c.entityId)?.card)
				.filter((c) => c != null)
				.map((c) => getCost(c, state.playerDeck, this.allCards)).length || null,
		setting: {
			label: (i18n: ILocalizationService): string => this.allCards.getCard(CardIds.JadeGuardians_JAIL_474)?.name,
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.jade-guardians-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentJadeGuardiansCounter' as const,
		display: (state: GameState): boolean => {
			return initialHeroClassIs(state.opponentDeck?.hero, [CardClass.ROGUE]);
		},
		value: (state: GameState): number | null =>
			state.opponentDeck?.cardsPlayedThisMatch
				.map((c) => state.opponentDeck.findCard(c.entityId)?.card)
				.filter((c) => c != null)
				.map((c) => getCost(c, state.opponentDeck, this.allCards)).length || null,
		setting: {
			label: (i18n: ILocalizationService): string => this.allCards.getCard(CardIds.JadeGuardians_JAIL_474)?.name,
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.jade-guardians-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.jade-guardians.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}
}
