/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds, GameFormat } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class ShockspitterCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'shockspitter';
	public override image = CardIds.Shockspitter;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.Shockspitter, CardIds.KurtrusDemonRender];

	readonly player = {
		pref: 'playerShockspitterCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.heroAttacksThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.hero-attacks-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.hero-attacks-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentShockspitterCounter' as const,
		display: (state: GameState): boolean =>
			state?.metadata?.formatType === GameFormat.FT_WILD &&
			initialHeroClassIs(state.opponentDeck.hero, [CardClass.HUNTER]),
		value: (state: GameState) => {
			return state.opponentDeck.heroAttacksThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.shockspitter-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.shockspitter-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.hero-attacks.${side}`, { value: value });
	}
}
