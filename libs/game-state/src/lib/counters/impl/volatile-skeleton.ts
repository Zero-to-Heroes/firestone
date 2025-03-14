/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class VolatileSkeletonCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'volatileSkeleton';
	public override image = CardIds.VolatileSkeleton;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.KelthuzadTheInevitable_REV_514,
		CardIds.KelthuzadTheInevitable_REV_786,
		// Show the counter if Xyrella the Devout is in deck, and skeletons have been summoned?
	];

	readonly player = {
		pref: 'playerVolatileSkeletonCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.volatileSkeletonsDeadThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.volatile-skeleton-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.volatile-skeleton-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentVolatileSkeletonCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.opponentDeck.volatileSkeletonsDeadThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.volatile-skeleton-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.volatile-skeleton-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState);
		return this.i18n.translateString(`counters.volatile-skeleton.${side}`, { value: value });
	}
}
