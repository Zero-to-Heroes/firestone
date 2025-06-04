/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class SeaShantyCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'seaShanty';
	public override image = CardIds.SeaShanty_VAC_558;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.SeaShanty_VAC_558];

	readonly player = {
		pref: 'playerSeaShantyCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return (
				[...state.playerDeck.spellsPlayedOnFriendlyEntities, ...state.playerDeck.spellsPlayedOnEnemyEntities]
					.length ?? 0
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.sea-shanty-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.sea-shanty-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentSeaShantyCounter' as const,
		display: (state: GameState): boolean => initialHeroClassIs(state.opponentDeck.hero, [CardClass.PALADIN]),
		value: (state: GameState) => {
			const result = [
				...state.opponentDeck.spellsPlayedOnFriendlyEntities,
				...state.opponentDeck.spellsPlayedOnEnemyEntities,
			].length;
			return result || null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.sea-shanty-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.sea-shanty-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.sea-shanty.${side}`, {
			value: value,
		});
	}
}
