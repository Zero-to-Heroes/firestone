/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { isTreant } from '../../services/card-utils';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class TreantDeadCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'treantDead';
	public override image = CardIds.SplinteredReality_END_009;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.SplinteredReality_END_009,
		CardIds.Mulchmuncher,
	];

	readonly player = {
		pref: 'playerTreantDeadCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return (
				state.playerDeck.minionsDeadThisMatch.filter((c) => isTreant(c.cardId, this.allCards)).length || null
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.treant-dead-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.treant-dead-tooltip'),
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
		const value = this[side]?.value(gameState);
		return this.i18n.translateString(`counters.specific-deaths.${side}`, {
			value: value,
			cardName: this.allCards.getCard(CardIds.ForestSeedlings_TreantToken).name,
		});
	}
}
