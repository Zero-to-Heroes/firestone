/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class WheelOfDeathCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'wheelOfDeath';
	public override image = CardIds.WheelOfDeath_TOY_529;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.WheelOfDeath_TOY_529];

	readonly player = {
		pref: 'playerWheelOfDeathCounter' as const,
		display: (state: GameState): boolean => state.opponentDeck?.wheelOfDeathCounter != null,
		value: (state: GameState) => {
			return state.opponentDeck.wheelOfDeathCounter ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.wheel-of-death-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.wheel-of-death-tooltip', {
					cardName: this.allCards.getCard(CardIds.WheelOfDeath_TOY_529).name,
				}),
		},
	};
	readonly opponent = {
		pref: 'opponentWheelOfDeathCounter' as const,
		display: (state: GameState): boolean => state.playerDeck?.wheelOfDeathCounter != null,
		value: (state: GameState) => {
			return state.playerDeck.wheelOfDeathCounter ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.wheel-of-death-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.wheel-of-death-tooltip', {
					cardName: this.allCards.getCard(CardIds.WheelOfDeath_TOY_529).name,
				}),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.wheel-of-death.${side}`, {
			value: value,
		});
	}
}
