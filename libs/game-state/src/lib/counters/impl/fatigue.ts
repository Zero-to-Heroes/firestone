/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

const cards: readonly CardIds[] = [CardIds.CurseOfAgony_AgonyToken];

export class FatigueCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'fatigue';
	public override image = '';
	public override imageIcon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/FATIGUE.jpg`;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerFatigueCounter' as const,
		display: (state: GameState): boolean => {
			return state.playerDeck.hasRelevantCard(cards) || this.player.value(state) > 0;
		},
		value: (state: GameState) => {
			return state.playerDeck.fatigue ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.fatigue-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentFatigueCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.opponentDeck.fatigue ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		const nextFatigue = value + 1;
		return this.i18n.translateString(`counters.fatigue.${side}`, { value: nextFatigue });
	}
}
