/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DragoncallerAlannaCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'dragoncallerAlanna';
	public override image = CardIds.DragoncallerAlanna;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.DragoncallerAlanna];

	readonly player = {
		pref: 'playerDragoncallerAlannaCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.spellsPlayedThisMatch?.filter((c) => c.getEffectiveManaCost() >= 5)?.length ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragoncaller-alanna-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragoncaller-alanna-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState)!;
		return this.i18n.translateString(`counters.dragoncaller-alanna.${side}`, { value: value });
	}
}
