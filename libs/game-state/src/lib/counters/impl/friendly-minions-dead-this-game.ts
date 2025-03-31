/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class FriendlyMinionsDeadThisGameCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'friendlyDeadMinionsThisGame';
	public override image = CardIds.Aessina_EDR_430;
	public override cards: readonly CardIds[] = [CardIds.Aessina_EDR_430, CardIds.Starsurge_EDR_941];

	readonly player = {
		pref: 'playerFriendlyDeadMinionsThisGameCounter2' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck.minionsDeadThisMatch.length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.friendly-dead-minions-this-game-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.friendly-dead-minions-this-game-tooltip'),
		},
	};

	readonly opponent = undefined;
	// {
	// 	pref: 'opponentFriendlyDeadMinionsThisGameCounter' as const,
	// 	display: (state: GameState): boolean => {
	// 		if (!initialHeroClassIs(state.opponentDeck.hero, [CardClass.MAGE])) {
	// 			return false;
	// 		}

	// 		return !!state.fullGameState?.Opponent?.PlayerEntity?.tags?.find((t) => t.Name === GameTag.IMBUES_THIS_GAME)
	// 			?.Value || state.opponentDeck.plaed
	// 	},
	// 	value: (state: GameState): number => state.opponentDeck.minionsDeadThisMatch.length,
	// 	setting: {
	// 		label: (i18n: ILocalizationService): string =>
	// 			i18n.translateString('settings.decktracker.your-deck.counters.friendly-dead-minions-this-game-label'),
	// 		tooltip: (i18n: ILocalizationService): string =>
	// 			i18n.translateString('settings.decktracker.your-deck.counters.friendly-dead-minions-this-game-tooltip'),
	// 	},
	// };

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const deadMinions = side === 'player' ? this.player.value(gameState) : null; // this.opponent.value(gameState);
		const tooltip = this.i18n.translateString(`counters.friendly-dead-minions-this-game.player`, {
			value: deadMinions,
		});
		return tooltip;
	}
}
