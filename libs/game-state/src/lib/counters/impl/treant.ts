/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class TreantCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'treant';
	public override image = CardIds.SoulOfTheForest_TreantLegacyToken;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.Cultivation];

	readonly player = {
		pref: 'playerTreantCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.treantsSummoned ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.treant-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.treant-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState);
		return this.i18n.translateString(`counters.specific-summons.${side}`, {
			value: value,
			cardName: this.allCards.getCard(CardIds.ForestSeedlings_TreantToken).name,
		});
	}
}
