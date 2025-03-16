/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds, GameFormat, GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class HeroPowerDamageCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'heroPowerDamage';
	public override image = CardIds.MordreshFireEye;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.MordreshFireEye, CardIds.JanalaiTheDragonhawk];

	readonly player = {
		pref: 'playerHeroPowerDamageCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.heroPowerDamageThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-damage-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.hero-power-damage-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentHeroPowerDamageCounter' as const,
		display: (state: GameState): boolean => {
			const isCorrectFormat =
				state?.metadata?.formatType === GameFormat.FT_WILD && state.metadata.gameType === GameType.GT_RANKED;
			return isCorrectFormat && initialHeroClassIs(state.opponentDeck.hero, [CardClass.MAGE]);
		},
		value: (state: GameState) => {
			return state.opponentDeck.heroPowerDamageThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-damage-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-damage-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.hero-power-damage.${side}`, { value: value });
	}
}
