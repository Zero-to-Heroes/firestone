/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class HeroPowerUseCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'heroPowerUse';
	public override image = CardIds.GlowrootLure_EDR_477;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.GlowrootLure_EDR_477];

	readonly player = {
		pref: 'playerHeroPowerUsedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.heroPowerUsed ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-use-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-use-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.hero-power-use.${side}`, { value: value });
	}
}
