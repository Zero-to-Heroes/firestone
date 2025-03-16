/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, RELIC_IDS } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class BonelordFrostwhisperCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bonelordFrostwhisper';
	public override image = CardIds.BonelordFrostwhisper;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.ArtificerXymox_REV_787,
		CardIds.ArtificerXymox_REV_937,
		CardIds.ArtificerXymox_ArtificerXymoxToken,
		...RELIC_IDS,
	];

	readonly player = {
		pref: 'playerBonelordFrostwhisperCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			if (!state.playerDeck.bonelordFrostwhisperFirstTurnTrigger) {
				return null;
			}

			const delta = 6 - (state.gameTagTurnNumber - state.playerDeck.bonelordFrostwhisperFirstTurnTrigger);
			if (delta <= 0) {
				return null;
			}

			const value = Math.ceil(delta / 2);
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentBonelordFrostwhisperCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			if (!state.opponentDeck.bonelordFrostwhisperFirstTurnTrigger) {
				return null;
			}

			const delta = 6 - (state.gameTagTurnNumber - state.opponentDeck.bonelordFrostwhisperFirstTurnTrigger);
			if (delta <= 0) {
				return null;
			}

			const value = Math.ceil(delta / 2);
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.bonelord-frostwhisper.${side}`, { value: value });
	}
}
