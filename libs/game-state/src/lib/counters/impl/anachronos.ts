/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class AnachronosCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'anachronos';
	public override image = CardIds.Anachronos;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.Anachronos];

	readonly player = {
		pref: 'playerAnachronosCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			const lastAnachronosTurn =
				state.playerDeck.anachronosTurnsPlayed[state.playerDeck.anachronosTurnsPlayed.length - 1];
			if (!lastAnachronosTurn) {
				return null;
			}

			const delta = 4 - (state.gameTagTurnNumber - lastAnachronosTurn);
			if (delta <= 0) {
				return null;
			}

			const value = Math.ceil(delta / 2);
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.anachronos-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.anachronos-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentAnachronosCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			const lastAnachronosTurn =
				state.opponentDeck.anachronosTurnsPlayed[state.opponentDeck.anachronosTurnsPlayed.length - 1];
			if (!lastAnachronosTurn) {
				return null;
			}

			const delta = 4 - (state.gameTagTurnNumber - lastAnachronosTurn);
			if (delta <= 0) {
				return null;
			}

			const value = Math.ceil(delta / 2);
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.anachronos-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.anachronos-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.anachronos.player`, { value: value });
	}
}
