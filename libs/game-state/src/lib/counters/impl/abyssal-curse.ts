/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { sumOnArray } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class AbyssalCurseCounterDefinitionV2 extends CounterDefinitionV2<{
	lastCurseDamage: number;
	totalDamageFromCursesInHand: number;
}> {
	public override id: CounterType = 'abyssalCurse';
	public override image = CardIds.SirakessCultist_AbyssalCurseToken;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerAbyssalCurseCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return buildValue(state.playerDeck);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.abyssal-curse-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentAbyssalCurseCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return buildValue(state.opponentDeck);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(
		value: { lastCurseDamage: number; totalDamageFromCursesInHand: number } | null | undefined,
	): null | undefined | number | string {
		if (!value) {
			return `0 | 0`;
		}
		return `${value.lastCurseDamage} | ${value.totalDamageFromCursesInHand}`;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState);
		return this.i18n.translateString(`counters.abyssal-curse-2.${side}`, {
			value: value?.lastCurseDamage,
			totalDamageFromCursesInHand: value?.totalDamageFromCursesInHand,
		});
	}
}

const buildValue = (deck: DeckState): { lastCurseDamage: number; totalDamageFromCursesInHand: number } | null => {
	const lastCurseDamage = deck.abyssalCurseHighestValue ?? 0;
	const totalDamageFromCursesInHand = sumOnArray(
		deck.hand.filter((c) => c.cardId == CardIds.SirakessCultist_AbyssalCurseToken),
		(c) => (c.mainAttributeChange ?? 0) + 1,
	);
	if (!lastCurseDamage && !totalDamageFromCursesInHand) {
		return null;
	}
	return { lastCurseDamage, totalDamageFromCursesInHand };
};
