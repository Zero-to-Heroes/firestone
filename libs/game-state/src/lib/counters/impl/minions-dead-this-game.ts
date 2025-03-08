/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class MinionsDeadThisGameCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'deadMinionsThisGame';
	public override image = CardIds.ReskaThePitBoss_WW_373;
	public override cards: readonly CardIds[] = [CardIds.ReskaThePitBoss_WW_373];

	readonly player = {
		pref: 'playerDeadMinionsThisGameCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.minionsDeadThisMatch.length + state.opponentDeck.minionsDeadThisMatch.length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dead-minions-this-game-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dead-minions-this-game-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentDeadMinionsThisGameCounter' as const,
		display: (state: GameState): boolean =>
			initialHeroClassIs(state.opponentDeck.hero, [CardClass.DEATHKNIGHT]) ||
			state.opponentDeck?.hasRelevantCard([CardIds.ReskaThePitBoss_WW_373]),
		value: (state: GameState): number =>
			state.playerDeck.minionsDeadThisMatch.length + state.opponentDeck.minionsDeadThisMatch.length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dead-minions-this-game-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.dead-minions-this-game-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const deadMinions = side === 'player' ? this.player.value(gameState) : this.opponent.value(gameState);
		const tooltip = this.i18n.translateString(`counters.dead-minions-this-game.player`, {
			value: deadMinions,
		});
		return tooltip;
	}
}
