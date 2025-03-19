/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export const DEFAULT_CTHUN_ATK = 6;
export const DEFAULT_CTHUN_HEALTH = 6;

export class CthunCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'cthun';
	public override image = CardIds.Cthun_OG_280;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.Cthun_OG_279, CardIds.Cthun_OG_280];

	readonly player = {
		pref: 'playerCthunCounter' as const,
		display: (state: GameState): boolean => !!state.playerDeck?.containsCthun(this.allCards),
		value: (state: GameState) => {
			return {
				atk: state.playerDeck.cthunAtk || DEFAULT_CTHUN_ATK,
				health: state.playerDeck.cthunHealth || DEFAULT_CTHUN_HEALTH,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cthun-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentCthunCounter' as const,
		display: (state: GameState): boolean => !!state?.opponentDeck?.containsCthun(this.allCards),
		value: (state: GameState) => {
			return {
				atk: state.opponentDeck.cthunAtk || DEFAULT_CTHUN_ATK,
				health: state.opponentDeck.cthunHealth || DEFAULT_CTHUN_HEALTH,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(
		value: { atk: number; health: number } | null | undefined,
	): null | undefined | number | string {
		return `${value?.atk} / ${value?.health}`;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState);
		return this.i18n.translateString(`counters.cthun.${side}`, {
			atk: value?.atk,
			health: value?.health,
		});
	}
}
