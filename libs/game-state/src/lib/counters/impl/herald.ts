/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { getColossalForSide, getHeraldAmount } from '../../services/cards/onyxias-wing';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

// Cataclysm Herald counter: tracks how many times each player has Heralded their class Colossal.
// Image shows the class-specific Cataclysm Colossal.
export class HeraldCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'herald';
	public override image = (gameState: GameState, side: 'player' | 'opponent'): string | undefined =>
		getColossalForSide(gameState, side);
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerHeraldCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => getHeraldAmount(state, 'player'),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.herald-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.herald-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentHeraldCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => getHeraldAmount(state, 'opponent'),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.herald-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.herald-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.herald.${side}`, { value: value });
	}
}
